import { groupForPlace } from './placesCategories';

export interface BusinessProfile {
  id: string;
  name: string;
  types: string | string[];
  website?: string | null;
  address?: string | null;
  category: string | null;
  complexity: number; // 1-10 scale
  chainStatus: 'INDEPENDENT' | 'REGIONAL_CHAIN' | 'NATIONAL_CHAIN' | 'INTERNATIONAL_CHAIN';
  recommendedStrategy: EnrichmentStrategy[];
  searchQueries: string[];
}

export interface EnrichmentStrategy {
  name: 'GOOGLE_SEARCH' | 'OUTSCRAPER_FILTERED' | 'OUTSCRAPER_MINIMAL';
  priority: number; // 1 = highest priority
  filtering: 'MINIMAL' | 'MODERATE' | 'AGGRESSIVE';
  description: string;
}

export class BusinessAnalyzer {
  private chainIndicators = {
    INDEPENDENT: ['independent', 'family', 'local', 'owner'],
    REGIONAL_CHAIN: ['regional', 'local chain', 'area'],
    NATIONAL_CHAIN: ['ltd', 'limited', 'plc', 'uk', 'britain'],
    INTERNATIONAL_CHAIN: ['international', 'global', 'worldwide', 'corporate', 'headquarters']
  };

  analyzeBusiness(business: {
    id: string;
    name: string;
    types: string | string[];
    website?: string | null;
    address?: string | null;
  }): BusinessProfile {
    const category = groupForPlace(business.types, business.name);
    const complexity = this.calculateComplexity(business, category);
    const chainStatus = this.detectChainStatus(business);
    const recommendedStrategy = this.getOptimalStrategy(complexity, chainStatus, category);
    const searchQueries = this.generateSearchQueries(business, category);

    return {
      id: business.id,
      name: business.name,
      types: business.types,
      website: business.website,
      address: business.address,
      category,
      complexity,
      chainStatus,
      recommendedStrategy,
      searchQueries
    };
  }

  private calculateComplexity(business: any, category: string | null): number {
    let score = 0;
    
    // Website sophistication
    if (business.website) {
      if (business.website.includes('corporate')) score += 3;
      if (business.website.includes('investor')) score += 2;
      if (business.website.includes('press')) score += 1;
    }
    
    // Business name indicators
    const lowerName = business.name.toLowerCase();
    if (lowerName.includes('ltd') || lowerName.includes('limited')) score += 1;
    if (lowerName.includes('plc')) score += 2;
    if (lowerName.includes('corp') || lowerName.includes('corporation')) score += 2;
    if (lowerName.includes('international')) score += 3;
    if (lowerName.includes('global')) score += 3;
    
    // Address indicators
    if (business.address) {
      const lowerAddress = business.address.toLowerCase();
      if (lowerAddress.includes('headquarters')) score += 3;
      if (lowerAddress.includes('main office')) score += 2;
      if (lowerAddress.includes('corporate')) score += 2;
    }
    
    // Category-based complexity
    if (category === 'Hotels & Accommodation') {
      // Hotels can be simple B&Bs or complex international chains
      if (business.name.toLowerCase().includes('hilton') || 
          business.name.toLowerCase().includes('ihg') ||
          business.name.toLowerCase().includes('marriott')) {
        score += 2;
      }
    }
    
    return Math.min(Math.max(score, 1), 10); // Ensure 1-10 scale
  }

  private detectChainStatus(business: any): 'INDEPENDENT' | 'REGIONAL_CHAIN' | 'NATIONAL_CHAIN' | 'INTERNATIONAL_CHAIN' {
    const lowerName = business.name.toLowerCase();
    const lowerAddress = business.address?.toLowerCase() || '';
    
    // Check for international indicators
    if (lowerName.includes('international') || 
        lowerName.includes('global') || 
        lowerName.includes('worldwide') ||
        lowerAddress.includes('headquarters')) {
      return 'INTERNATIONAL_CHAIN';
    }
    
    // Check for national indicators
    if (lowerName.includes('ltd') || 
        lowerName.includes('limited') || 
        lowerName.includes('plc') ||
        lowerName.includes('uk') ||
        lowerName.includes('britain')) {
      return 'NATIONAL_CHAIN';
    }
    
    // Check for regional indicators
    if (lowerName.includes('regional') || 
        lowerName.includes('area') ||
        (Array.isArray(business.types) ? business.types.includes('chain') : business.types.includes('chain'))) {
      return 'REGIONAL_CHAIN';
    }
    
    // Default to independent
    return 'INDEPENDENT';
  }

  private getOptimalStrategy(
    complexity: number, 
    chainStatus: string, 
    category: string | null
  ): EnrichmentStrategy[] {
    const strategies: EnrichmentStrategy[] = [];
    
    if (complexity >= 7 || chainStatus === 'INTERNATIONAL_CHAIN') {
      // Large chains: Focus on Google Search for local contacts
      strategies.push({
        name: 'GOOGLE_SEARCH',
        priority: 1,
        filtering: 'AGGRESSIVE',
        description: 'Primary source for local managers and decision-makers'
      });
      strategies.push({
        name: 'OUTSCRAPER_FILTERED',
        priority: 2,
        filtering: 'AGGRESSIVE',
        description: 'Supplement with heavily filtered website scraping'
      });
    } else if (complexity >= 4 || chainStatus === 'NATIONAL_CHAIN') {
      // Medium businesses: Balanced approach
      strategies.push({
        name: 'GOOGLE_SEARCH',
        priority: 1,
        filtering: 'MODERATE',
        description: 'Find local contacts and recent mentions'
      });
      strategies.push({
        name: 'OUTSCRAPER_FILTERED',
        priority: 2,
        filtering: 'MODERATE',
        description: 'Website scraping with moderate filtering'
      });
    } else {
      // Small businesses: Any contact info is valuable
      strategies.push({
        name: 'OUTSCRAPER_MINIMAL',
        priority: 1,
        filtering: 'MINIMAL',
        description: 'Accept most website scraping results'
      });
      strategies.push({
        name: 'GOOGLE_SEARCH',
        priority: 2,
        filtering: 'MINIMAL',
        description: 'Supplement with basic search queries'
      });
    }
    
    return strategies;
  }

  private generateSearchQueries(business: any, category: string | null): string[] {
    const location = this.extractLocation(business.address);
    const baseQueries = [
      `${business.name} ${location} contact`,
      `${business.name} ${location} phone`
    ];
    
    // Add category-specific queries
    if (category) {
      switch (category) {
        case 'Hotels & Accommodation':
          baseQueries.push(`${business.name} ${location} manager`);
          baseQueries.push(`${business.name} ${location} reception`);
          baseQueries.push(`${business.name} ${location} general manager`);
          break;
          
        case 'Restaurants & Cafes':
          baseQueries.push(`${business.name} ${location} owner`);
          baseQueries.push(`${business.name} ${location} manager`);
          baseQueries.push(`${business.name} ${location} head chef`);
          break;
          
        case 'Bars & Nightlife':
          baseQueries.push(`${business.name} ${location} manager`);
          baseQueries.push(`${business.name} ${location} owner`);
          baseQueries.push(`${business.name} ${location} licensee`);
          break;
          
        case 'Offices & Coworking':
          baseQueries.push(`${business.name} ${location} director`);
          baseQueries.push(`${business.name} ${location} manager`);
          baseQueries.push(`${business.name} ${location} contact`);
          break;
          
        case 'Retail & Services':
          baseQueries.push(`${business.name} ${location} store manager`);
          baseQueries.push(`${business.name} ${location} owner`);
          baseQueries.push(`${business.name} ${location} supervisor`);
          break;
          
        case 'Fitness & Wellness':
          baseQueries.push(`${business.name} ${location} manager`);
          baseQueries.push(`${business.name} ${location} owner`);
          baseQueries.push(`${business.name} ${location} trainer`);
          break;
          
        case 'Events & Conferences':
          baseQueries.push(`${business.name} ${location} manager`);
          baseQueries.push(`${business.name} ${location} coordinator`);
          baseQueries.push(`${business.name} ${location} contact`);
          break;
          
        default:
          baseQueries.push(`${business.name} ${location} manager`);
          baseQueries.push(`${business.name} ${location} contact`);
      }
    }
    
    return baseQueries;
  }

  private extractLocation(address?: string | null): string {
    if (!address) return 'hull'; // Default to Hull
    
    // Try to extract city/town from address
    const addressParts = address.toLowerCase().split(',');
    for (const part of addressParts) {
      const trimmed = part.trim();
      if (trimmed.includes('hull') || trimmed.includes('kingston')) {
        return 'hull';
      }
      if (trimmed.includes('leeds')) return 'leeds';
      if (trimmed.includes('manchester')) return 'manchester';
      if (trimmed.includes('birmingham')) return 'birmingham';
      if (trimmed.includes('london')) return 'london';
    }
    
    return 'hull'; // Default fallback
  }
}

// Export singleton instance
export const businessAnalyzer = new BusinessAnalyzer();
