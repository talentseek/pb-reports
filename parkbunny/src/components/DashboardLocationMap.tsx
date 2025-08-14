'use client';

import { useEffect, useRef } from 'react';
declare global { interface Window { google?: any } }

type Location = {
  id: string;
  status: 'PENDING' | 'LIVE';
  latitude: number | null;
  longitude: number | null;
  postcode: string;
  reportName: string;
};

type DashboardLocationMapProps = {
  center: { lat: number; lng: number } | null;
  locations: Location[];
  apiKey: string;
};

export default function DashboardLocationMap({ center, locations, apiKey }: DashboardLocationMapProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !apiKey || !center) return;
    
    const id = 'gmaps-script';
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    
    const init = () => {
      const g = window.google;
      if (!g?.maps) return;
      
      const map = new g.maps.Map(ref.current!, { 
        center, 
        zoom: 10, 
        mapTypeControl: false, 
        streetViewControl: false 
      });
      
      const bounds = new g.maps.LatLngBounds();
      
      // Create markers for each location
      locations.forEach(location => {
        if (location.latitude === null || location.longitude === null) return;
        
        const position = { lat: location.latitude, lng: location.longitude };
        
        // Different marker colors for live vs pending
        const markerColor = location.status === 'LIVE' ? '#10B981' : '#F59E0B'; // Green for live, amber for pending
        const markerIcon = {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        };
        
        const marker = new g.maps.Marker({ 
          position, 
          map, 
          title: `${location.reportName} - ${location.postcode} (${location.status})`,
          icon: markerIcon
        });
        
        // Add info window
        const infoWindow = new g.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-semibold">${location.reportName}</h3>
              <p class="text-sm">${location.postcode}</p>
              <p class="text-sm">
                Status: 
                <span class="font-medium ${location.status === 'LIVE' ? 'text-green-600' : 'text-amber-600'}">
                  ${location.status}
                </span>
              </p>
            </div>
          `
        });
        
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
        
        bounds.extend(marker.getPosition()!);
      });
      
      if (locations.length > 0) {
        map.fitBounds(bounds);
        
        // Add some padding to the bounds
        const listener = g.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          const currentBounds = map.getBounds();
          if (currentBounds) {
            const ne = currentBounds.getNorthEast();
            const sw = currentBounds.getSouthWest();
            const latDiff = (ne.lat() - sw.lat()) * 0.1;
            const lngDiff = (ne.lng() - sw.lng()) * 0.1;
            
            const newBounds = new g.maps.LatLngBounds(
              new g.maps.LatLng(sw.lat() - latDiff, sw.lng() - lngDiff),
              new g.maps.LatLng(ne.lat() + latDiff, ne.lng() + lngDiff)
            );
            map.fitBounds(newBounds);
          }
        });
      }
    };
    
    if (existing) {
      if (window.google?.maps) init();
      else existing.addEventListener('load', init, { once: true });
      return;
    }
    
    const s = document.createElement('script');
    s.id = id;
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    s.onload = init;
    document.head.appendChild(s);
  }, [apiKey, center?.lat, center?.lng, locations]);

  return <div ref={ref} className="w-full h-80 rounded-md" />;
}
