'use client'

import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Props = {
    lat: number
    lng: number
    markerColor: string
    locationName: string
}

function createMarkerIcon(color: string) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
    <text x="12" y="14.5" text-anchor="middle" font-size="7" font-weight="bold" fill="${color}">P</text>
  </svg>`

    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [32, 48],
        iconAnchor: [16, 48],
        popupAnchor: [0, -48],
    })
}

export default function DemoMap({ lat, lng, markerColor, locationName }: Props) {
    return (
        <MapContainer
            center={[lat, lng]}
            zoom={16}
            scrollWheelZoom={false}
            dragging={false}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
            attributionControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution=""
            />
            <Marker position={[lat, lng]} icon={createMarkerIcon(markerColor)}>
                <Popup>
                    <strong>{locationName}</strong>
                </Popup>
            </Marker>
        </MapContainer>
    )
}
