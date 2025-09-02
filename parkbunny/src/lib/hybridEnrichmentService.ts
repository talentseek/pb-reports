import { businessAnalyzer, BusinessProfile, EnrichmentStrategy } from './businessAnalyzer';
import { googleSearchService, GoogleSearchResult } from './googleSearchService';
import { outscraperService, EnrichmentResult } from './outscraper';

export interface HybridEnrichmentResult {
  businessId: string;
  businessName: string;
  businessProfile: BusinessProfile;
  googlePlacesData: {
    phone?: string;
    website?: string;
    address?: string;
  };
  googleSearchResults: GoogleSearchResult[];
  outscraperResults: EnrichmentResult;
  combinedContacts: {
    primaryEmail?: string;
    primaryPhone?: string;
    allEmails: Array<{ value: string; source: string; relevance: number }>;
    allPhones: Array<{ value: string; source: string; relevance: number }>;
    contactPeople: Array<{ name: string; title?: string; email?: string; linkedin?: string; relevance: number }>;
  };
  overallRelevanceScore: number;
  enrichmentStrategy: EnrichmentStrategy[];
}

export class HybridEnrichmentService {
  async enrichBusiness(
    business: {
      id: string;
      name: string;
      types: string[];
      website?: string | null;
      address?: string | null;
      phone?: string | null;
    }
  ): Promise<HybridEnrichmentResult> {
    console.log(`Starting hybrid enrichment for: ${business.name}`);
    
    // Step 1: Analyze business and determine strategy
    const businessProfile = businessAnalyzer.analyzeBusiness(business);
    console.log(`Business complexity: ${businessProfile.complexity}/10, Strategy: ${businessProfile.recommendedStrategy.map(s => s.name).join(', ')}`);
    
    // Step 2: Extract Google Places data (already available)
    const googlePlacesData = {
      phone: business.phone || undefined,
      website: business.website || undefined,
      address: business.address || undefined
    };
    
    // Step 3: Execute Google Search (if recommended)
    let googleSearchResults: GoogleSearchResult[] = [];
    const googleSearchStrategy = businessProfile.recommendedStrategy.find(s => s.name === 'GOOGLE_SEARCH');
    if (googleSearchStrategy) {
      console.log(`Executing Google Search strategy: ${googleSearchStrategy.description}`);
      try {
        const searchResponse = await googleSearchService.searchMultipleQueries(
          businessProfile.searchQueries.slice(0, 3), // Limit to top 3 queries
          businessProfile.searchQueries[0]?.includes('hull') ? 'hull' : 'uk'
        );
        if (searchResponse.success) {
          googleSearchResults = searchResponse.results;
          console.log(`Found ${googleSearchResults.length} Google Search results`);
        }
      } catch (error) {
        console.error('Google Search failed:', error);
      }
    }
    
    // Step 4: Execute Outscraper (if recommended)
    let outscraperResults: EnrichmentResult = { success: false };
    const outscraperStrategy = businessProfile.recommendedStrategy.find(s => s.name.startsWith('OUTSCRAPER'));
    if (outscraperStrategy && business.website) {
      console.log(`Executing Outscraper strategy: ${outscraperStrategy.description}`);
      try {
        const rawResults = await outscraperService.enrichBusiness(business.website, business.name);
        
        // Apply smart filtering based on strategy
        const filteringLevel = outscraperStrategy.filtering;
        outscraperResults = (outscraperService as any).applySmartFiltering(rawResults, filteringLevel);
        
        console.log(`Outscraper found ${outscraperResults.allEmails?.length || 0} emails, ${outscraperResults.allPhones?.length || 0} phones`);
      } catch (error) {
        console.error('Outscraper failed:', error);
      }
    }
    
    // Step 5: Combine and prioritize all results
    const combinedContacts = this.combineContactResults(
      googlePlacesData,
      googleSearchResults,
      outscraperResults,
      businessProfile
    );
    
    // Step 6: Calculate overall relevance score
    const overallRelevanceScore = this.calculateOverallRelevance(
      combinedContacts,
      googleSearchResults,
      outscraperResults
    );
    
    return {
      businessId: business.id,
      businessName: business.name,
      businessProfile,
      googlePlacesData,
      googleSearchResults,
      outscraperResults,
      combinedContacts,
      overallRelevanceScore,
      enrichmentStrategy: businessProfile.recommendedStrategy
    };
  }
  
  private combineContactResults(
    googlePlacesData: any,
    googleSearchResults: GoogleSearchResult[],
    outscraperResults: EnrichmentResult,
    businessProfile: BusinessProfile
  ) {
    const combined: any = {
      allEmails: [],
      allPhones: [],
      contactPeople: []
    };
    
    // Add Google Places phone (highest priority - verified local)
    if (googlePlacesData.phone) {
      combined.allPhones.push({
        value: googlePlacesData.phone,
        source: 'Google Places API',
        relevance: 1.0 // Highest relevance for verified local data
      });
      combined.primaryPhone = googlePlacesData.phone;
    }
    
    // Add Outscraper emails and phones (filtered by relevance)
    if (outscraperResults.allEmails) {
      combined.allEmails.push(...outscraperResults.allEmails.map(email => ({
        value: email.value,
        source: email.source || 'Outscraper',
        relevance: email.relevance || 0.5
      })));
    }
    
    if (outscraperResults.allPhones) {
      combined.allPhones.push(...outscraperResults.allPhones.map(phone => ({
        value: phone.value,
        source: phone.source || 'Outscraper',
        relevance: phone.relevance || 0.5
      })));
    }
    
    // Add Outscraper contact people
    if (outscraperResults.contactPeople) {
      combined.contactPeople.push(...outscraperResults.contactPeople.map(contact => ({
        full_name: contact.full_name,
        title: contact.title,
        value: contact.value,
        level: contact.level,
        inferred_salary: contact.inferred_salary,
        gender: contact.gender,
        socials: contact.socials,
        relevance: contact.relevance || 0.5
      })));
    }
    
    // Add Google Search contact people (high relevance for local contacts)
    googleSearchResults.forEach(result => {
      if (result.contactInfo?.name && result.relevance > 0.7) {
        combined.contactPeople.push({
          full_name: result.contactInfo.name,
          title: result.contactInfo.title,
          value: result.contactInfo.email,
          level: 'contact',
          relevance: result.relevance,
          source: 'Google Search'
        });
      }
    });
    
    // Sort by relevance and set primary contacts
    combined.allEmails.sort((a: any, b: any) => b.relevance - a.relevance);
    combined.allPhones.sort((a: any, b: any) => b.relevance - a.relevance);
    combined.contactPeople.sort((a: any, b: any) => b.relevance - a.relevance);
    
    // Set primary contacts
    if (combined.allEmails.length > 0) {
      combined.primaryEmail = combined.allEmails[0].value;
    }
    
    if (combined.allPhones.length > 0 && !combined.primaryPhone) {
      combined.primaryPhone = combined.allPhones[0].value;
    }
    
    return combined;
  }
  
  private calculateOverallRelevance(
    combinedContacts: any,
    googleSearchResults: GoogleSearchResult[],
    outscraperResults: EnrichmentResult
  ): number {
    let totalScore = 0;
    let count = 0;
    
    // Google Places data (highest weight)
    if (combinedContacts.primaryPhone) {
      totalScore += 1.0 * 2; // Double weight for verified local data
      count += 2;
    }
    
    // Combined contact relevance
    if (combinedContacts.allEmails.length > 0) {
      const avgEmailRelevance = combinedContacts.allEmails.reduce((sum: number, email: any) => sum + email.relevance, 0) / combinedContacts.allEmails.length;
      totalScore += avgEmailRelevance;
      count += 1;
    }
    
    if (combinedContacts.allPhones.length > 0) {
      const avgPhoneRelevance = combinedContacts.allPhones.reduce((sum: number, phone: any) => sum + phone.relevance, 0) / combinedContacts.allPhones.length;
      totalScore += avgPhoneRelevance;
      count += 1;
    }
    
    if (combinedContacts.contactPeople.length > 0) {
      const avgContactRelevance = combinedContacts.contactPeople.reduce((sum: number, contact: any) => sum + contact.relevance, 0) / combinedContacts.contactPeople.length;
      totalScore += avgContactRelevance;
      count += 1;
    }
    
    // Google Search relevance
    if (googleSearchResults.length > 0) {
      const avgSearchRelevance = googleSearchResults.reduce((sum, result) => sum + result.relevance, 0) / googleSearchResults.length;
      totalScore += avgSearchRelevance * 0.8; // Slightly lower weight than direct contacts
      count += 0.8;
    }
    
    // Outscraper relevance
    if (outscraperResults.relevanceScore) {
      totalScore += outscraperResults.relevanceScore * 0.6; // Lower weight due to potential noise
      count += 0.6;
    }
    
    return count > 0 ? totalScore / count : 0;
  }
  
  async enrichMultipleBusinesses(businesses: any[]): Promise<HybridEnrichmentResult[]> {
    const results: HybridEnrichmentResult[] = [];
    
    // Process businesses sequentially to avoid overwhelming APIs
    for (const business of businesses) {
      try {
        const result = await this.enrichBusiness(business);
        results.push(result);
        
        // Add delay between businesses to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Failed to enrich business ${business.name}:`, error);
        // Add failed result with error
        results.push({
          businessId: business.id,
          businessName: business.name,
          businessProfile: businessAnalyzer.analyzeBusiness(business),
          googlePlacesData: {},
          googleSearchResults: [],
          outscraperResults: { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
          combinedContacts: { allEmails: [], allPhones: [], contactPeople: [] },
          overallRelevanceScore: 0,
          enrichmentStrategy: []
        });
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const hybridEnrichmentService = new HybridEnrichmentService();
