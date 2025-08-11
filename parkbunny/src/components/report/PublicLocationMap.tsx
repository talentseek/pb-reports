'use client'

import { useEffect, useRef } from 'react'
declare global { interface Window { google?: any } }

type Marker = { lat: number; lng: number; title: string; category: string }

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
      for (const m of markers) {
        const marker = new g.maps.Marker({ position: { lat: m.lat, lng: m.lng }, map, title: m.title })
        bounds.extend(marker.getPosition()!)
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


