interface OutscraperAsyncResponse {
  status: string;
  id: string;
  results_location: string;
}

interface OutscraperDataResponse {
  data: Array<{
    query: string;
    emails?: Array<{
      value: string;
      source: string;
    }>;
    phones?: Array<{
      value: string;
      source: string;
    }>;
    socials?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
    };
    contacts?: Array<{
      full_name: string;
      value: string;
      title: string;
      level: string;
    }>;
    details?: {
      size?: string | { f: number; t: number };
      industry?: string[];
      name?: string;
      founded?: string;
      brand?: string;
      type?: string;
      address?: string;
      city?: string;
      country?: string;
      postal_code?: string;
      state?: string;
      employees?: string;
      sales?: string;
      sic?: string;
    };
    site_data?: {
      description?: string;
      title?: string;
      keywords?: string;
      generator?: string;
      ga_code?: string;
      has_fb_pixel?: boolean;
      has_google_tag?: boolean;
    };
  }>;
}

export interface EnrichmentResult {
  email?: string;  // Primary email (first one found)
  phone?: string;  // Primary phone (first one found)
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
    github?: string;
  };
  // Comprehensive data
  allEmails?: Array<{
    value: string;
    source?: string;
    full_name?: string;
    title?: string;
    level?: string;
    inferred_salary?: string;
    gender?: string;
    socials?: any;
    relevance?: number; // 0-1 scale for local relevance
  }>;
  allPhones?: Array<{
    value: string;
    source?: string;
    relevance?: number; // 0-1 scale for local relevance
  }>;
  contactPeople?: Array<{
    full_name: string;
    title?: string;
    level?: string;
    inferred_salary?: string;
    gender?: string;
    socials?: any;
    value: string;  // their email
    relevance?: number; // 0-1 scale for local relevance
  }>;
  businessDetails?: {
    size?: string | { f: number; t: number };
    industry?: string[];
    name?: string;
    founded?: string;
    brand?: string;
    type?: string;
    address?: string;
    city?: string;
    country?: string;
    postal_code?: string;
    state?: string;
    employees?: string;
    sales?: string;
    sic?: string;
  };
  siteData?: {
    description?: string;
    title?: string;
    keywords?: string;
    generator?: string;
    ga_code?: string;
    has_fb_pixel?: boolean;
    has_google_tag?: boolean;
  };
  success: boolean;
  error?: string;
  filteringLevel?: 'MINIMAL' | 'MODERATE' | 'AGGRESSIVE';
  relevanceScore?: number; // Overall relevance score
}

export class OutscraperService {
  private apiKey: string;
  private baseUrl = 'https://api.app.outscraper.com';

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Outscraper API key is required. Please set the OUTSCRAPER_API_KEY environment variable.');
    }
    this.apiKey = apiKey;
  }

  async enrichBusiness(website: string, businessName: string): Promise<EnrichmentResult> {
    if (!website) {
      return {
        success: false,
        error: 'No website provided'
      };
    }

    try {
      // Build query parameters for GET request
      const params = new URLSearchParams({
        query: website,
        limit: '1',
        language: 'en',
        region: 'uk'
      });

      const url = `${this.baseUrl}/emails-and-contacts?${params}`;
      console.log('Outscraper API request URL:', url);
      console.log('Outscraper API request headers:', { 'X-API-KEY': this.apiKey });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-KEY': this.apiKey,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Outscraper API error response:', errorText);
        throw new Error(`Outscraper API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const asyncResponse: OutscraperAsyncResponse = await response.json();
      console.log('Outscraper API async response:', JSON.stringify(asyncResponse, null, 2));
      
      if (asyncResponse.status === 'Pending') {
        // Poll for results
        return await this.pollForResults(asyncResponse.results_location);
      } else if (asyncResponse.status === 'Completed') {
        // Get results directly
        return await this.getResults(asyncResponse.results_location);
      } else {
        return {
          success: false,
          error: `Unexpected status: ${asyncResponse.status}`
        };
      }

    } catch (error) {
      console.error('Outscraper enrichment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async pollForResults(resultsLocation: string, maxAttempts: number = 10): Promise<EnrichmentResult> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      try {
        const response = await fetch(resultsLocation, {
          method: 'GET',
          headers: {
            'X-API-KEY': this.apiKey,
          }
        });

        if (response.ok) {
          const data: OutscraperDataResponse = await response.json();
          console.log('Outscraper API results:', JSON.stringify(data, null, 2));
          
          if (data.data && data.data.length > 0) {
            const result = data.data[0];
            const enrichmentResult = {
              // Primary contact info (first found)
              email: result.emails?.[0]?.value || undefined,
              phone: result.phones?.[0]?.value || undefined,
              socialLinks: result.socials || undefined,
              
              // Comprehensive data
              allEmails: result.emails || undefined,
              allPhones: result.phones || undefined,
              contactPeople: result.contacts || undefined,
              businessDetails: result.details || undefined,
              siteData: result.site_data || undefined,
              
              success: true
            };
            
            console.log('Extracted enrichment result (polling):', JSON.stringify(enrichmentResult, null, 2));
            return enrichmentResult;
          }
        }
      } catch (error) {
        console.error(`Polling attempt ${attempt + 1} failed:`, error);
      }
    }

    return {
      success: false,
      error: 'Timeout waiting for results'
    };
  }

  private async getResults(resultsLocation: string): Promise<EnrichmentResult> {
    try {
      const response = await fetch(resultsLocation, {
        method: 'GET',
        headers: {
          'X-API-KEY': this.apiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get results: ${response.status} ${response.statusText}`);
      }

      const data: OutscraperDataResponse = await response.json();
      console.log('Outscraper API results:', JSON.stringify(data, null, 2));
      
      if (!data.data || data.data.length === 0) {
        return {
          success: false,
          error: 'No enrichment data found'
        };
      }

      const result = data.data[0];
      
      const enrichmentResult = {
        // Primary contact info (first found)
        email: result.emails?.[0]?.value || undefined,
        phone: result.phones?.[0]?.value || undefined,
        socialLinks: result.socials || undefined,
        
        // Comprehensive data
        allEmails: result.emails || undefined,
        allPhones: result.phones || undefined,
        contactPeople: result.contacts || undefined,
        businessDetails: result.details || undefined,
        siteData: result.site_data || undefined,
        
        success: true
      };
      
      console.log('Extracted enrichment result:', JSON.stringify(enrichmentResult, null, 2));
      return enrichmentResult;
    } catch (error) {
      console.error('Error getting results:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim() !== '';
  }

  async enrichMultipleBusinesses(businesses: Array<{id: string, website: string, name: string}>): Promise<Map<string, EnrichmentResult>> {
    const results = new Map<string, EnrichmentResult>();
    
    // Process businesses in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < businesses.length; i += batchSize) {
      const batch = businesses.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (business) => {
        const result = await this.enrichBusiness(business.website, business.name);
        return { id: business.id, result };
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ id, result }) => {
        results.set(id, result);
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < businesses.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Smart filtering based on business complexity and filtering level
  private applySmartFiltering(result: any, filteringLevel: 'MINIMAL' | 'MODERATE' | 'AGGRESSIVE'): EnrichmentResult {
    const filteredResult: EnrichmentResult = {
      success: result.success,
      error: result.error,
      filteringLevel,
      relevanceScore: 0
    };

    if (!result.success) return filteredResult;

    // Apply filtering to emails
    if (result.allEmails) {
      filteredResult.allEmails = this.filterEmails(result.allEmails, filteringLevel);
      filteredResult.email = filteredResult.allEmails[0]?.value;
    }

    // Apply filtering to phones
    if (result.allPhones) {
      filteredResult.allPhones = this.filterPhones(result.allPhones, filteringLevel);
      filteredResult.phone = filteredResult.allPhones[0]?.value;
    }

    // Apply filtering to contact people
    if (result.contactPeople) {
      filteredResult.contactPeople = this.filterContactPeople(result.contactPeople, filteringLevel);
    }

    // Keep other fields
    filteredResult.socialLinks = result.socialLinks;
    filteredResult.businessDetails = result.businessDetails;
    filteredResult.siteData = result.siteData;

    // Calculate overall relevance score
    filteredResult.relevanceScore = this.calculateOverallRelevance(filteredResult);

    return filteredResult;
  }

  private filterEmails(emails: any[], filteringLevel: string): any[] {
    return emails.filter(email => {
      const relevance = this.calculateEmailRelevance(email);
      email.relevance = relevance;

      switch (filteringLevel) {
        case 'MINIMAL':
          return relevance >= 0.1; // Accept most emails
        case 'MODERATE':
          return relevance >= 0.4; // Moderate filtering
        case 'AGGRESSIVE':
          return relevance >= 0.7; // Heavy filtering
        default:
          return true;
      }
    }).sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  }

  private filterPhones(phones: any[], filteringLevel: string): any[] {
    return phones.filter(phone => {
      const relevance = this.calculatePhoneRelevance(phone);
      phone.relevance = relevance;

      switch (filteringLevel) {
        case 'MINIMAL':
          return relevance >= 0.1;
        case 'MODERATE':
          return relevance >= 0.4;
        case 'AGGRESSIVE':
          return relevance >= 0.7;
        default:
          return true;
      }
    }).sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  }

  private filterContactPeople(contacts: any[], filteringLevel: string): any[] {
    return contacts.filter(contact => {
      const relevance = this.calculateContactRelevance(contact);
      contact.relevance = relevance;

      switch (filteringLevel) {
        case 'MINIMAL':
          return relevance >= 0.1;
        case 'MODERATE':
          return relevance >= 0.4;
        case 'AGGRESSIVE':
          return relevance >= 0.7;
        default:
          return true;
      }
    }).sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  }

  private calculateEmailRelevance(email: any): number {
    let score = 0.5; // Base score
    
    const value = email.value?.toLowerCase() || '';
    const source = email.source?.toLowerCase() || '';
    
    // Boost for local/UK domains
    if (value.includes('.co.uk') || value.includes('.uk')) score += 0.2;
    if (value.includes('hull') || value.includes('local')) score += 0.3;
    
    // Boost for business-specific emails
    if (value.includes('manager') || value.includes('reception') || value.includes('info')) score += 0.2;
    
    // Penalize for corporate/headquarters
    if (value.includes('corporate') || value.includes('headquarters') || value.includes('hq')) score -= 0.3;
    
    // Penalize for US domains
    if (value.includes('.com') && !value.includes('.co.uk')) score -= 0.2;
    
    return Math.max(0, Math.min(score, 1));
  }

  private calculatePhoneRelevance(phone: any): number {
    let score = 0.5; // Base score
    
    const value = phone.value || '';
    
    // Boost for UK numbers
    if (value.startsWith('44') || value.startsWith('+44') || value.startsWith('0')) score += 0.3;
    
    // Penalize for US numbers
    if (value.startsWith('1') && value.length === 10) score -= 0.4;
    
    return Math.max(0, Math.min(score, 1));
  }

  private calculateContactRelevance(contact: any): number {
    let score = 0.5; // Base score
    
    const title = contact.title?.toLowerCase() || '';
    const level = contact.level?.toLowerCase() || '';
    
    // Boost for decision-making roles
    if (title.includes('manager') || title.includes('director') || title.includes('owner')) score += 0.3;
    if (level.includes('manager') || level.includes('head')) score += 0.2;
    
    // Penalize for low-level roles
    if (title.includes('assistant') || title.includes('receptionist')) score -= 0.2;
    
    return Math.max(0, Math.min(score, 1));
  }

  private calculateOverallRelevance(result: EnrichmentResult): number {
    let totalScore = 0;
    let count = 0;
    
    if (result.allEmails?.length) {
      totalScore += result.allEmails.reduce((sum, email) => sum + (email.relevance || 0), 0);
      count += result.allEmails.length;
    }
    
    if (result.allPhones?.length) {
      totalScore += result.allPhones.reduce((sum, phone) => sum + (phone.relevance || 0), 0);
      count += result.allPhones.length;
    }
    
    if (result.contactPeople?.length) {
      totalScore += result.contactPeople.reduce((sum, contact) => sum + (contact.relevance || 0), 0);
      count += result.contactPeople.length;
    }
    
    return count > 0 ? totalScore / count : 0;
  }
}

// Export a singleton instance
export const outscraperService = new OutscraperService(
  process.env.OUTSCRAPER_API_KEY || (() => {
    console.error('OUTSCRAPER_API_KEY environment variable is not set. Please add it to your .env file.');
    return '';
  })()
);
