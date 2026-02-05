'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'
import type { BuzzBingoSite } from '@/lib/buzzbingo-logic'

// Custom red marker for Buzz Bingo brand color
const buzzBingoIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

function FlyToSelected({ site }: { site: BuzzBingoSite | null }) {
    const map = useMap()
    useEffect(() => {
        if (site?.lat && site?.lng) {
            map.flyTo([site.lat, site.lng], 12, { duration: 0.8 })
        }
    }, [site, map])
    return null
}

interface Props {
    data: BuzzBingoSite[]
    selectedId: string | null
    onSelect: (id: string | null) => void
}

export default function BuzzBingoMap({ data, selectedId, onSelect }: Props) {
    const validSites = data.filter(s => s.lat !== null && s.lng !== null)
    const selectedSite = validSites.find(s => s.id === selectedId) || null

    // Center on UK
    const ukCenter: [number, number] = [53.5, -2.0]

    return (
        <MapContainer
            center={ukCenter}
            zoom={6}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyToSelected site={selectedSite} />
            {validSites.map(site => (
                <Marker
                    key={site.id}
                    position={[site.lat!, site.lng!]}
                    icon={buzzBingoIcon}
                    eventHandlers={{
                        click: () => onSelect(site.id)
                    }}
                >
                    <Popup>
                        <div className="text-sm">
                            <p className="font-semibold">Buzz Bingo {site.name}</p>
                            <p className="text-gray-600">{site.postcode}</p>
                            <p className="text-gray-500 text-xs">{site.region}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}
