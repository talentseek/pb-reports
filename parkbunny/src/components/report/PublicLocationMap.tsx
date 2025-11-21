'use client'

import { useEffect, useRef } from 'react'
declare global { interface Window { google?: any } }

type Marker = { lat: number; lng: number; title: string; category: string; address?: string; website?: string }

// Helper to generate SVG data URI for category icons
function getCategoryIcon(category: string, google: any) {
  let color = '#6b7280' // default gray
  let path = ''

  if (category.includes('Shopping')) {
    color = '#3b82f6' // blue
    // Shopping bag
    path = 'M16 6V4a4 4 0 0 0-8 0v2H4v14h16V6h-4zm-6-2a2 2 0 0 1 2 2v2h-4V4zm9 14H5V8h14v10z'
  } else if (category.includes('Food')) {
    color = '#f97316' // orange
    // Fork and Knife
    path = 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z'
  } else if (category.includes('Entertainment')) {
    color = '#a855f7' // purple
    // Star
    path = 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'
  } else if (category.includes('Lodging')) {
    color = '#ec4899' // pink
    // Bed
    path = 'M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z'
  } else if (category.includes('Health')) {
    color = '#10b981' // green
    // Cross
    path = 'M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z'
  } else if (category.includes('Services')) {
    color = '#6b7280' // gray
    // Wrench/Gear
    path = 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.68 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.48.48 0 0 0-.12.61l1.92 3.32c.12.23.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z'
  } else if (category.includes('Sports')) {
    color = '#ef4444' // red
    // Trophy/Activity
    path = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'
  }

  // Create SVG with circle background and icon
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
      <g transform="translate(4, 4)">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
          <path d="${path}"/>
        </svg>
      </g>
    </svg>
  `

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(32, 32),
    anchor: new google.maps.Point(16, 16),
  }
}

export default function PublicLocationMap({ center, markers, apiKey }: { center: { lat: number, lng: number } | null; markers: Marker[]; apiKey: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || !apiKey || !center) return
    const id = 'gmaps-script'
    const existing = document.getElementById(id) as HTMLScriptElement | null
    const init = () => {
      const g = window.google
      if (!g?.maps) return
      const map = new g.maps.Map(ref.current!, { center, zoom: 14, mapTypeControl: false, streetViewControl: false })
      const bounds = new g.maps.LatLngBounds()
      const infoWindow = new g.maps.InfoWindow()

      // Add car park marker at center with custom icon
      const carParkMarker = new g.maps.Marker({
        position: center,
        map,
        title: 'Car Park Location',
        icon: {
          url: '/parking-icon.png',
          scaledSize: new g.maps.Size(60, 60),
          anchor: new g.maps.Point(30, 30),
        },
        zIndex: 1000, // Ensure it appears above other markers
      })

      // Add click listener for car park marker
      carParkMarker.addListener('click', () => {
        const content = `
          <div style="font-family: system-ui, -apple-system, sans-serif; padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">🅿️ Car Park Location</h3>
            <p style="margin: 0; font-size: 13px; color: #4b5563;">This is the analyzed car park location. Nearby businesses are shown as smaller markers.</p>
          </div>
        `
        infoWindow.setContent(content)
        infoWindow.open(map, carParkMarker)
      })

      bounds.extend(center)

      for (const m of markers) {
        const marker = new g.maps.Marker({
          position: { lat: m.lat, lng: m.lng },
          map,
          title: m.title,
          icon: getCategoryIcon(m.category, g),
        })
        bounds.extend(marker.getPosition()!)

        // Add click listener to show info window
        marker.addListener('click', () => {
          const content = `
            <div style="font-family: system-ui, -apple-system, sans-serif; padding: 8px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${m.title}</h3>
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">
                <span style="display: inline-block; padding: 2px 8px; background: #e0e7ff; color: #4f46e5; border-radius: 4px; font-size: 11px; font-weight: 500;">
                  ${m.category}
                </span>
              </p>
              ${m.address ? `<p style="margin: 0 0 6px 0; font-size: 13px; color: #4b5563;">${m.address}</p>` : ''}
              ${m.website ? `<p style="margin: 0; font-size: 13px;"><a href="${m.website}" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: none;">Visit Website →</a></p>` : ''}
            </div>
          `
          infoWindow.setContent(content)
          infoWindow.open(map, marker)
        })
      }
      if (markers.length > 0) map.fitBounds(bounds)
    }
    if (existing) {
      if (window.google?.maps) init()
      else existing.addEventListener('load', init, { once: true })
      return
    }
    const s = document.createElement('script')
    s.id = id
    s.async = true
    s.defer = true
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`
    s.onload = init
    document.head.appendChild(s)
  }, [apiKey, center?.lat, center?.lng, markers])

  return <div ref={ref} className="w-full h-80" />
}
