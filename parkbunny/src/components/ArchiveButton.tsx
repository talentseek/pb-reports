"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore } from "lucide-react";

type ArchiveButtonProps = {
  reportId: string;
  isArchived: boolean;
};

export default function ArchiveButton({ reportId, isArchived }: ArchiveButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleToggleArchive = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/archive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ archived: !isArchived }),
      });

      if (!response.ok) {
        throw new Error("Failed to update report");
      }

      // Refresh the page to show updated state
      window.location.reload();
    } catch (error) {
      console.error("Error updating report:", error);
      alert("Failed to update report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggleArchive}
      disabled={loading}
      className="text-xs"
    >
      {loading ? (
        "Updating..."
      ) : isArchived ? (
        <>
          <ArchiveRestore className="w-3 h-3 mr-1" />
          Unarchive
        </>
      ) : (
        <>
          <Archive className="w-3 h-3 mr-1" />
          Archive
        </>
      )}
    </Button>
  );
}
