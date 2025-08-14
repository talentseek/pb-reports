'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLocationMap from './DashboardLocationMap';

type Location = {
  id: string;
  status: 'PENDING' | 'LIVE';
  latitude: number | null;
  longitude: number | null;
  postcode: string;
  reportName: string;
};

type Stats = {
  totalReports: number;
  activeReports: number;
  archivedReports: number;
  totalBusinesses: number;
  businessesByCategory: Record<string, number>;
};

type DashboardOverviewProps = {
  stats: Stats;
  locations: Location[];
};

export default function DashboardOverview({ stats, locations }: DashboardOverviewProps) {
  // Filter locations that have valid coordinates
  const validLocations = locations.filter(loc => loc.latitude && loc.longitude);
  
  // Calculate center point for map
  const center = validLocations.length > 0 ? {
    lat: validLocations.reduce((sum, loc) => sum + loc.latitude!, 0) / validLocations.length,
    lng: validLocations.reduce((sum, loc) => sum + loc.longitude!, 0) / validLocations.length
  } : null;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeReports} active, {stats.archivedReports} archived
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBusinesses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.filter(loc => loc.status === 'LIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {locations.length} total locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locations.filter(loc => loc.status === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting activation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Businesses by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Businesses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.businessesByCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category}</span>
                  <span className="text-sm text-muted-foreground">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Location Map */}
        <Card>
          <CardHeader>
            <CardTitle>All Locations</CardTitle>
          </CardHeader>
          <CardContent>
            {validLocations.length > 0 ? (
              <DashboardLocationMap 
                center={center}
                locations={validLocations}
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
              />
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No locations with coordinates found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
