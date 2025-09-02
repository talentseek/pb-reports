'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EnrichmentStep from "@/components/EnrichmentStep";
import LaunchStep from "@/components/LaunchStep";
import { StepIndicator } from "@/components/ui/step-indicator";

interface CampaignStepsProps {
  campaign: any;
  businessData: any[];
}

export default function CampaignSteps({ campaign, businessData }: CampaignStepsProps) {
  const [currentStep, setCurrentStep] = useState(() => {
    // Determine initial step based on campaign status
    switch (campaign.status) {
      case 'CREATED':
        return 2; // Show enrichment step for new campaigns
      case 'ENRICHING':
        return 2; // Show enrichment step while enriching
      case 'ENRICHED':
      case 'READY_TO_LAUNCH':
      case 'LAUNCHED':
        return 3;
      default:
        return 2; // Default to enrichment step
    }
  });

  const steps = [
    { id: 'select', title: 'Select Businesses', description: 'Choose businesses for outreach' },
    { id: 'enrich', title: 'Enrich Data', description: 'Gather contact information' },
    { id: 'launch', title: 'Launch Campaign', description: 'Send outreach messages' }
  ];

  // Determine which steps are clickable based on campaign status
  const getClickableSteps = () => {
    const clickable = [1]; // Step 1 (Select) is always clickable
    
    // Step 2 (Enrich) is clickable for new campaigns and enriched campaigns
    if (campaign.status === 'CREATED' || campaign.status === 'ENRICHING' || 
        campaign.status === 'ENRICHED' || campaign.status === 'READY_TO_LAUNCH' || campaign.status === 'LAUNCHED') {
      clickable.push(2);
    }
    
    if (campaign.status === 'READY_TO_LAUNCH' || campaign.status === 'LAUNCHED') {
      clickable.push(3); // Step 3 (Launch) is clickable if ready
    }
    
    return clickable;
  };

  const handleStepClick = (stepNumber: number) => {
    // Only allow navigation to completed or current steps
    if (getClickableSteps().includes(stepNumber)) {
      setCurrentStep(stepNumber);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Business Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  {campaign.businesses.length} businesses selected for this campaign.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {businessData.map((business) => (
                    <div key={business.id} className="p-4 border rounded-lg">
                      <div className="font-medium">{business.name}</div>
                      {business.website && (
                        <div className="text-sm text-gray-600 mt-1">
                          🌐 <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {business.website}
                          </a>
                        </div>
                      )}
                      <div className="mt-2">
                        <Badge variant="outline" className="capitalize">
                          {business.enrichmentStatus.toLowerCase().replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 2:
        return <EnrichmentStep campaignId={campaign.id} businesses={businessData} />;
      case 3:
        return <LaunchStep campaignId={campaign.id} businesses={businessData} />;
      default:
        return <EnrichmentStep campaignId={campaign.id} businesses={businessData} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <Card>
        <CardContent className="pt-6">
          <StepIndicator 
            steps={steps} 
            currentStep={currentStep} 
            onStepClick={handleStepClick}
            clickableSteps={getClickableSteps()}
          />
        </CardContent>
      </Card>

      {/* Step Content */}
      {renderStepContent()}
    </div>
  );
}
