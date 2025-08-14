"use client";
import { useState, useMemo } from "react";
import DashboardFilters from "./DashboardFilters";
import ReportList from "./report/ReportList";

type Report = {
  id: string;
  name: string;
  postcodes: string;
  createdAt: string | Date;
  shareEnabled?: boolean;
  shareCode?: string | null;
  settings?: any;
  locations?: { id: string; status: 'PENDING' | 'LIVE' }[];
  user?: {
    email: string;
  };
  archived: boolean;
};

type DashboardClientProps = {
  reports: Report[];
};

export default function DashboardClient({ reports }: DashboardClientProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [liveFilter, setLiveFilter] = useState<'all' | 'has-live' | 'no-live'>('all');

  // Calculate statistics
  const stats = useMemo(() => {
    const totalReports = reports.length;
    const activeReports = reports.filter(r => !r.archived).length;
    const archivedReports = reports.filter(r => r.archived).length;
    const reportsWithLive = reports.filter(r => 
      r.locations && r.locations.some(loc => loc.status === 'LIVE')
    ).length;

    return {
      totalReports,
      activeReports,
      archivedReports,
      reportsWithLive
    };
  }, [reports]);

  // Filter reports based on current filters
  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Apply archive filter
    if (activeFilter === 'active') {
      filtered = filtered.filter(r => !r.archived);
    } else if (activeFilter === 'archived') {
      filtered = filtered.filter(r => r.archived);
    }

    // Apply live location filter
    if (liveFilter === 'has-live') {
      filtered = filtered.filter(r => 
        r.locations && r.locations.some(loc => loc.status === 'LIVE')
      );
    } else if (liveFilter === 'no-live') {
      filtered = filtered.filter(r => 
        !r.locations || !r.locations.some(loc => loc.status === 'LIVE')
      );
    }

    return filtered;
  }, [reports, activeFilter, liveFilter]);

  return (
    <div className="space-y-6">
      <DashboardFilters
        activeFilter={activeFilter}
        liveFilter={liveFilter}
        onFilterChange={setActiveFilter}
        onLiveFilterChange={setLiveFilter}
        totalReports={stats.totalReports}
        activeReports={stats.activeReports}
        archivedReports={stats.archivedReports}
        reportsWithLive={stats.reportsWithLive}
      />

      {filteredReports.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {activeFilter === 'archived' 
              ? 'No archived reports found.' 
              : activeFilter === 'active'
              ? 'No active reports found.'
              : 'No reports match the current filters.'
            }
          </p>
        </div>
      ) : (
        <ReportList reports={filteredReports} />
      )}
    </div>
  );
}
