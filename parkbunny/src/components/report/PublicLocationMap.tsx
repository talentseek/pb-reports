'use client'

import { useEffect, useRef } from 'react'
declare global { interface Window { google?: any } }

type Marker = { lat: number; lng: number; title: string; category: string; address?: string; website?: string }

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
        const marker = new g.maps.Marker({ position: { lat: m.lat, lng: m.lng }, map, title: m.title })
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


