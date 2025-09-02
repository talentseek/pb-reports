'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Step indicator is now handled by parent component
import { useRouter } from 'next/navigation';

interface EnrichmentStepProps {
  campaignId: string;
  businesses: Array<{
    id: string;
    name: string;
    website: string | null;
    email: string | null;
    phone: string | null;
    socialLinks: any;
    enrichmentStatus: string;
    allEmails?: any;
    allPhones?: any;
    contactPeople?: any;
    businessDetails?: any;
    siteData?: any;
  }>;
}

export default function EnrichmentStep({ campaignId, businesses }: EnrichmentStepProps) {
  const router = useRouter();
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentStats, setEnrichmentStats] = useState<Record<string, number>>({});
  const [campaignStatus, setCampaignStatus] = useState('CREATED');

  // Steps are now handled by parent component

  const businessesWithWebsites = businesses.filter(b => b.website);
  const enrichedCount = businesses.filter(b => b.enrichmentStatus === 'ENRICHED').length;
  const failedCount = businesses.filter(b => b.enrichmentStatus === 'FAILED').length;

  const handleStartEnrichment = async () => {
    setIsEnriching(true);
    try {
      const response = await fetch('/api/outreach/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaignId }),
      });

      if (response.ok) {
        const result = await response.json();
        setEnrichmentStats({
          ENRICHED: result.enriched,
          FAILED: result.total - result.enriched,
          NOT_ENRICHED: businessesWithWebsites.length - result.total
        });
        setCampaignStatus(result.campaignStatus);
        
        // If enrichment was successful, automatically navigate to launch step
        if (result.enriched > 0) {
          // Small delay to ensure data is saved
          setTimeout(() => {
            router.push(`/outreach/campaigns/${campaignId}/launch`);
          }, 1000);
        } else {
          // Refresh the page to show updated data if no enrichment
          router.refresh();
        }
      } else {
        console.error('Failed to start enrichment');
      }
    } catch (error) {
      console.error('Error starting enrichment:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleProceedToLaunch = () => {
    router.push(`/outreach/campaigns/${campaignId}/launch`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ENRICHED':
        return <Badge className="bg-green-100 text-green-800">✓ Enriched</Badge>;
      case 'ENRICHING':
        return <Badge className="bg-blue-100 text-blue-800">⏳ Enriching</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">✗ Failed</Badge>;
      default:
        return <Badge variant="outline">Not Enriched</Badge>;
    }
  };

  return (
    <div className="space-y-6">

      {/* Enrichment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Enrichment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{businessesWithWebsites.length}</div>
              <div className="text-sm text-gray-600">With Websites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{enrichedCount}</div>
              <div className="text-sm text-gray-600">Enriched</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {businessesWithWebsites.length - enrichedCount - failedCount}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        {campaignStatus === 'CREATED' && (
          <Button 
            onClick={handleStartEnrichment}
            disabled={isEnriching || businessesWithWebsites.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isEnriching ? '⏳ Enriching...' : '🚀 Start Enrichment'}
          </Button>
        )}
        
        {campaignStatus === 'ENRICHED' && (
          <Button 
            onClick={handleProceedToLaunch}
            className="bg-blue-600 hover:bg-blue-700"
          >
            ➡️ Proceed to Launch
          </Button>
        )}

        {businessesWithWebsites.length === 0 && (
          <div className="text-sm text-gray-600">
            No businesses with websites found for enrichment
          </div>
        )}
      </div>

      {/* Business List with Enrichment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Business Enrichment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {businesses.map((business) => (
              <div key={business.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-lg">{business.name}</div>
                    {business.website && (
                      <div className="text-sm text-gray-600 mt-1">
                        🌐 <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {business.website}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(business.enrichmentStatus)}
                  </div>
                </div>
                
                {/* Show enrichment results if available */}
                {(business.email || business.phone || business.socialLinks || business.allEmails || business.allPhones || business.contactPeople || business.businessDetails) && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm font-medium text-green-800 mb-2">✅ Enrichment Results Found:</div>
                    <div className="space-y-3">
                      {/* Primary Contact Info */}
                      {(business.email || business.phone) && (
                        <div className="space-y-1">
                          {business.email && (
                            <div className="text-sm text-green-700">
                              📧 <strong>Primary Email:</strong> {business.email}
                            </div>
                          )}
                          {business.phone && (
                            <div className="text-sm text-green-700">
                              📞 <strong>Primary Phone:</strong> {business.phone}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* All Emails Found */}
                      {business.allEmails && Array.isArray(business.allEmails) && business.allEmails.length > 1 && (
                        <div className="text-sm text-green-700">
                          📧 <strong>All Emails ({business.allEmails.length}):</strong>
                          <div className="ml-4 mt-1 space-y-1">
                            {business.allEmails.map((email: any, idx) => (
                              <div key={idx} className="text-xs">
                                • {email.value} {email.source && `(from ${email.source})`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* All Phone Numbers */}
                      {business.allPhones && Array.isArray(business.allPhones) && business.allPhones.length > 1 && (
                        <div className="text-sm text-green-700">
                          📞 <strong>All Phones ({business.allPhones.length}):</strong>
                          <div className="ml-4 mt-1 space-y-1">
                            {business.allPhones.map((phone: any, idx) => (
                              <div key={idx} className="text-xs">
                                • {phone.value} {phone.source && `(from ${phone.source})`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Contact People */}
                      {business.contactPeople && Array.isArray(business.contactPeople) && business.contactPeople.length > 0 && (
                        <div className="text-sm text-green-700">
                          👥 <strong>Contact People ({business.contactPeople.length}):</strong>
                          <div className="ml-4 mt-1 space-y-1">
                            {business.contactPeople.map((person: any, idx) => (
                              <div key={idx} className="text-xs">
                                • <strong>{person.full_name}</strong> - {person.title || 'No title'} 
                                {person.level && ` (${person.level})`}
                                {person.inferred_salary && ` - ${person.inferred_salary}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Business Intelligence */}
                      {business.businessDetails && typeof business.businessDetails === 'object' && (
                        <div className="text-sm text-green-700">
                          🏢 <strong>Business Details:</strong>
                          <div className="ml-4 mt-1 space-y-1">
                            {business.businessDetails.size && (
                              <div className="text-xs">• Size: {typeof business.businessDetails.size === 'string' ? business.businessDetails.size : `${(business.businessDetails.size as any).f}-${(business.businessDetails.size as any).t} employees`}</div>
                            )}
                            {business.businessDetails.industry && Array.isArray(business.businessDetails.industry) && business.businessDetails.industry.length > 0 && (
                              <div className="text-xs">• Industry: {business.businessDetails.industry.join(', ')}</div>
                            )}
                            {business.businessDetails.founded && (
                              <div className="text-xs">• Founded: {business.businessDetails.founded}</div>
                            )}
                            {business.businessDetails.type && (
                              <div className="text-xs">• Type: {business.businessDetails.type}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Social Media */}
                      {business.socialLinks && (
                        <div className="text-sm text-green-700">
                          📱 <strong>Social Media:</strong> 
                          {business.socialLinks.facebook && <span className="ml-2">Facebook</span>}
                          {business.socialLinks.instagram && <span className="ml-2">Instagram</span>}
                          {business.socialLinks.twitter && <span className="ml-2">Twitter</span>}
                          {business.socialLinks.linkedin && <span className="ml-2">LinkedIn</span>}
                          {business.socialLinks.youtube && <span className="ml-2">YouTube</span>}
                          {business.socialLinks.tiktok && <span className="ml-2">TikTok</span>}
                          {business.socialLinks.github && <span className="ml-2">GitHub</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Show no results message for failed enrichments */}
                {business.enrichmentStatus === 'FAILED' && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-sm text-red-700">
                      ❌ No contact information found for this business
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
