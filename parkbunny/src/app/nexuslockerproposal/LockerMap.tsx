'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'
import type { LockerSite } from '@/lib/locker-logic'

// Fix for default Leaflet icon not found in Next.js
// We'll create a custom icon using a CDN or local asset
const customIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Generic location pin or use local
    // Let's use a nice colored pin or SVG
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
})

// Highlight icon for selected
const selectedIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [48, 48], // Larger
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
    className: 'leaflet-marker-selected' // We can add CSS glow if we want
})

// Component to handle flying to selected marker
function MapController({ selectedId, data }: { selectedId: string | null, data: LockerSite[] }) {
    const map = useMap()

    useEffect(() => {
        if (selectedId) {
            const site = data.find(d => d.id === selectedId)
            if (site && site.lat && site.lng) {
                map.flyTo([site.lat, site.lng], 14, { duration: 1.5 })
            }
        }
    }, [selectedId, data, map])

    return null
}

export default function LockerMap({ data, selectedId, onSelect }: {
    data: LockerSite[],
    selectedId: string | null,
    onSelect: (id: string) => void
}) {
    // Center of UK roughly
    const defaultCenter: [number, number] = [54.5, -3.0]

    // Filter valid lat/lng
    const validData = data.filter(d => d.lat !== null && d.lng !== null)

    return (
        <div className="h-full w-full">
            <MapContainer
                center={defaultCenter}
                zoom={6}
                className="h-full w-full"
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController selectedId={selectedId} data={validData} />

                {validData.map(site => (
                    <Marker
                        key={site.id}
                        position={[site.lat!, site.lng!] as [number, number]}
                        icon={selectedId === site.id ? selectedIcon : customIcon}
                        eventHandlers={{
                            click: () => onSelect(site.id)
                        }}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1">
                                <h3 className="font-bold text-sm mb-1">{site.name}</h3>
                                <p className="text-xs text-gray-500 mb-2">{site.address}</p>
                                <div className="text-xs font-mono bg-violet-100 text-violet-700 px-2 py-1 rounded inline-block">
                                    £{site.price.toLocaleString()}/yr
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}
