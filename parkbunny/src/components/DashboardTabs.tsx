'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardOverview from './DashboardOverview';
import DashboardReports from './DashboardReports';

type Location = {
  id: string;
  status: 'PENDING' | 'LIVE';
  latitude: number | null;
  longitude: number | null;
  postcode: string;
  reportName: string;
};

type Report = {
  id: string;
  name: string;
  postcodes: string;
  createdAt: string | Date;
  shareEnabled?: boolean;
  shareCode?: string | null;
  settings?: any;
  locations?: { id: string; status: 'PENDING' | 'LIVE' }[];
  user?: { email: string };
  archived: boolean;
};

type Stats = {
  totalReports: number;
  activeReports: number;
  archivedReports: number;
  totalBusinesses: number;
  businessesByCategory: Record<string, number>;
};

type DashboardTabsProps = {
  reports: Report[];
  stats: Stats;
  locations: Location[];
};

export default function DashboardTabs({ reports, stats, locations }: DashboardTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="mt-6">
        <DashboardOverview stats={stats} locations={locations} />
      </TabsContent>
      
      <TabsContent value="reports" className="mt-6">
        <DashboardReports reports={reports} />
      </TabsContent>
    </Tabs>
  );
}
