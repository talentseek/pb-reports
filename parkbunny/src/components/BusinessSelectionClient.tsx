'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';

type Place = {
  id: string;
  included: boolean;
  place: {
    id: string;
    name: string;
    address: string | null;
    rating: number | null;
    priceLevel: number | null;
    website: string | null;
    phone: string | null;
  };
};

type BusinessSelectionClientProps = {
  locationId: string;
  category: string;
  postcode: string;
  businesses: Place[];
};

export default function BusinessSelectionClient({
  locationId,
  category,
  postcode,
  businesses
}: BusinessSelectionClientProps) {
  const router = useRouter();
  const [selectedBusinesses, setSelectedBusinesses] = useState<Set<string>>(
    new Set(businesses.filter(b => b.included).map(b => b.id))
  );
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  const handleToggleBusiness = (businessId: string) => {
    const newSelected = new Set(selectedBusinesses);
    if (newSelected.has(businessId)) {
      newSelected.delete(businessId);
    } else {
      newSelected.add(businessId);
    }
    setSelectedBusinesses(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedBusinesses(new Set(businesses.map(b => b.id)));
  };

  const handleDeselectAll = () => {
    setSelectedBusinesses(new Set());
  };

  const handleCreateCampaign = async () => {
    if (selectedBusinesses.size === 0) return;

    setIsCreatingCampaign(true);
    try {
      const response = await fetch('/api/outreach/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId,
          category,
          postcode,
          businessIds: Array.from(selectedBusinesses)
        }),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/outreach/campaigns/${result.campaignId}`);
      } else {
        console.error('Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const getPriceLevelText = (level: number | null) => {
    if (level === null) return 'N/A';
    return '£'.repeat(level);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {selectedBusinesses.size} of {businesses.length} selected
          </span>
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeselectAll}>
            Deselect All
          </Button>
        </div>
        
        <Button 
          onClick={handleCreateCampaign}
          disabled={selectedBusinesses.size === 0 || isCreatingCampaign}
        >
          {isCreatingCampaign ? 'Creating Campaign...' : `Create Campaign (${selectedBusinesses.size})`}
        </Button>
      </div>

      {/* Business List */}
      <div className="grid gap-4">
        {businesses.map((business) => (
          <Card key={business.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedBusinesses.has(business.id)}
                  onCheckedChange={() => handleToggleBusiness(business.id)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {business.place.name}
                      </h3>
                      {business.place.address && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {business.place.address}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {business.place.rating && (
                        <Badge variant="outline" className="text-xs">
                          ⭐ {business.place.rating}
                        </Badge>
                      )}
                      {business.place.priceLevel !== null && (
                        <Badge variant="outline" className="text-xs">
                          {getPriceLevelText(business.place.priceLevel)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                    {business.place.website && (
                      <a 
                        href={business.place.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Website
                      </a>
                    )}
                    {business.place.phone && (
                      <span className="text-xs text-muted-foreground">
                        📞 {business.place.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {businesses.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No businesses found in this category. Try refreshing the location data in the report.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
