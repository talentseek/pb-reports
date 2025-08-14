"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle } from "lucide-react";

type LocationStatusButtonProps = {
  locationId: string;
  reportId: string;
  status: 'PENDING' | 'LIVE';
  postcode: string;
};

export default function LocationStatusButton({ locationId, reportId, status, postcode }: LocationStatusButtonProps) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      const newStatus = currentStatus === 'PENDING' ? 'LIVE' : 'PENDING';
      const response = await fetch(`/api/reports/${reportId}/locations/${locationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update location status");
      }

      setCurrentStatus(newStatus);
    } catch (error) {
      console.error("Error updating location status:", error);
      alert("Failed to update location status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={currentStatus === 'LIVE' ? 'default' : 'secondary'}
        className={`flex items-center gap-1 ${
          currentStatus === 'LIVE' 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }`}
      >
        {currentStatus === 'LIVE' ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <Clock className="w-3 h-3" />
        )}
        {currentStatus}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleStatus}
        disabled={loading}
        className="text-xs"
      >
        {loading ? (
          "Updating..."
        ) : currentStatus === 'PENDING' ? (
          "Mark Live"
        ) : (
          "Mark Pending"
        )}
      </Button>
    </div>
  );
}
