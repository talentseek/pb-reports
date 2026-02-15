'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const parkBeeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

type Site = {
    id: string
    name: string
    postcode: string
    lat: number | null
    lng: number | null
}

function FlyToSelected({ site }: { site: Site | undefined }) {
    const map = useMap()
    if (site?.lat && site?.lng) {
        map.flyTo([site.lat, site.lng], 14, { duration: 1.5 })
    }
    return null
}

export default function ParkBeeMap({
    sites,
    selectedSiteId,
    onSelectSite,
    center,
    zoom = 6
}: {
    sites: Site[]
    selectedSiteId: string | null
    onSelectSite: (id: string) => void
    center?: [number, number]
    zoom?: number
}) {
    const validSites = sites.filter(s => s.lat && s.lng)
    const selectedSite = validSites.find(s => s.id === selectedSiteId)
    const mapCenter: [number, number] = center || [53.0, -1.5] // UK center

    return (
        <MapContainer center={mapCenter} zoom={zoom} className="w-full h-full rounded-lg" scrollWheelZoom={false}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyToSelected site={selectedSite} />
            {validSites.map(site => (
                <Marker
                    key={site.id}
                    position={[site.lat!, site.lng!]}
                    icon={parkBeeIcon}
                    eventHandlers={{ click: () => onSelectSite(site.id) }}
                >
                    <Popup>
                        <strong>{site.name}</strong><br />
                        {site.postcode}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}
