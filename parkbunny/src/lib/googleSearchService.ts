export interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  relevance: number; // 0-1 scale
  contactInfo?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  };
}

export interface GoogleSearchResponse {
  success: boolean;
  results: GoogleSearchResult[];
  error?: string;
}

export class GoogleSearchService {
  private apiKey: string;
  private searchEngineId: string;
  private baseUrl = 'https://www.googleapis.com/customsearch/v1';

  constructor(apiKey: string, searchEngineId: string) {
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
  }

  async searchBusinessContacts(query: string, location: string = 'hull'): Promise<GoogleSearchResponse> {
    try {
      // Enhance query with location context
      const enhancedQuery = `${query} ${location}`;
      
      const url = `${this.baseUrl}?key=${this.apiKey}&cx=${this.searchEngineId}&q=${encodeURIComponent(enhancedQuery)}&num=10`;
      
      console.log('Google Search API request:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Search API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Google Search API error: ${data.error.message}`);
      }
      
      const results = this.parseSearchResults(data.items || []);
      
      return {
        success: true,
        results
      };
      
    } catch (error) {
      console.error('Google Search error:', error);
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private parseSearchResults(items: any[]): GoogleSearchResult[] {
    return items.map(item => {
      const result: GoogleSearchResult = {
        title: item.title || '',
        link: item.link || '',
        snippet: item.snippet || '',
        relevance: this.calculateRelevance(item),
        contactInfo: this.extractContactInfo(item)
      };
      
      return result;
    });
  }

  private calculateRelevance(item: any): number {
    let score = 0.5; // Base score
    
    const title = item.title?.toLowerCase() || '';
    const snippet = item.snippet?.toLowerCase() || '';
    const link = item.link?.toLowerCase() || '';
    
    // Boost for LinkedIn profiles (often contain contact info)
    if (link.includes('linkedin.com')) {
      score += 0.3;
    }
    
    // Boost for local business directories
    if (link.includes('yell.com') || link.includes('thomsonlocal.com') || link.includes('192.com')) {
      score += 0.2;
    }
    
    // Boost for recent news/articles
    if (title.includes('2024') || title.includes('2023') || title.includes('news')) {
      score += 0.1;
    }
    
    // Boost for contact-related terms
    if (title.includes('contact') || title.includes('manager') || title.includes('staff')) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  private extractContactInfo(item: any): any {
    const contactInfo: any = {};
    
    const title = item.title || '';
    const snippet = item.snippet || '';
    
    // Try to extract names and titles
    const nameTitleMatch = this.extractNameAndTitle(title + ' ' + snippet);
    if (nameTitleMatch) {
      contactInfo.name = nameTitleMatch.name;
      contactInfo.title = nameTitleMatch.title;
    }
    
    // Try to extract LinkedIn profile
    if (item.link?.includes('linkedin.com')) {
      contactInfo.linkedin = item.link;
    }
    
    return contactInfo;
  }

  private extractNameAndTitle(text: string): { name: string; title: string } | null {
    // Common patterns for "Name - Title" or "Name, Title"
    const patterns = [
      /([A-Z][a-z]+ [A-Z][a-z]+) - ([^,\n]+)/,
      /([A-Z][a-z]+ [A-Z][a-z]+), ([^,\n]+)/,
      /([A-Z][a-z]+ [A-Z][a-z]+) \(([^)]+)\)/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          name: match[1].trim(),
          title: match[2].trim()
        };
      }
    }
    
    return null;
  }

  // Method to search for multiple queries and combine results
  async searchMultipleQueries(queries: string[], location: string = 'hull'): Promise<GoogleSearchResponse> {
    const allResults: GoogleSearchResult[] = [];
    
    for (const query of queries) {
      try {
        const response = await this.searchBusinessContacts(query, location);
        if (response.success) {
          allResults.push(...response.results);
        }
        
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error searching for query "${query}":`, error);
      }
    }
    
    // Remove duplicates and sort by relevance
    const uniqueResults = this.removeDuplicates(allResults);
    const sortedResults = uniqueResults.sort((a, b) => b.relevance - a.relevance);
    
    return {
      success: true,
      results: sortedResults
    };
  }

  private removeDuplicates(results: GoogleSearchResult[]): GoogleSearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = result.link;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// Export singleton instance (will be configured with environment variables)
export const googleSearchService = new GoogleSearchService(
  process.env.GOOGLE_SEARCH_API_KEY || '',
  process.env.GOOGLE_SEARCH_ENGINE_ID || ''
);
