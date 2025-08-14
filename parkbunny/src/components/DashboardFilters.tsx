"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type FilterType = 'all' | 'active' | 'archived';
type LiveFilterType = 'all' | 'has-live' | 'no-live';

type DashboardFiltersProps = {
  activeFilter: FilterType;
  liveFilter: LiveFilterType;
  onFilterChange: (filter: FilterType) => void;
  onLiveFilterChange: (filter: LiveFilterType) => void;
  totalReports: number;
  activeReports: number;
  archivedReports: number;
  reportsWithLive: number;
};

export default function DashboardFilters({
  activeFilter,
  liveFilter,
  onFilterChange,
  onLiveFilterChange,
  totalReports,
  activeReports,
  archivedReports,
  reportsWithLive
}: DashboardFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Archive Status Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Archive Status</h3>
        <div className="flex gap-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('all')}
          >
            All Reports
            <Badge variant="secondary" className="ml-2">
              {totalReports}
            </Badge>
          </Button>
          <Button
            variant={activeFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('active')}
          >
            Active
            <Badge variant="secondary" className="ml-2">
              {activeReports}
            </Badge>
          </Button>
          <Button
            variant={activeFilter === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('archived')}
          >
            Archived
            <Badge variant="secondary" className="ml-2">
              {archivedReports}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Live Location Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Live Locations</h3>
        <div className="flex gap-2">
          <Button
            variant={liveFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onLiveFilterChange('all')}
          >
            All Reports
          </Button>
          <Button
            variant={liveFilter === 'has-live' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onLiveFilterChange('has-live')}
          >
            Has Live Locations
            <Badge variant="secondary" className="ml-2">
              {reportsWithLive}
            </Badge>
          </Button>
          <Button
            variant={liveFilter === 'no-live' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onLiveFilterChange('no-live')}
          >
            No Live Locations
            <Badge variant="secondary" className="ml-2">
              {totalReports - reportsWithLive}
            </Badge>
          </Button>
        </div>
      </div>
    </div>
  );
}
