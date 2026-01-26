import path from 'path'
import * as xlsx from 'xlsx'

export type LockerSite = {
    id: string
    name: string
    address: string
    city: string
    postcode: string
    spaces: number
    lat: number | null
    lng: number | null
    distanceToCentre: number | null
    price: number
}

// Pre-fetched city coordinates from Nominatim (Step 47)
const cityCache: Record<string, { lat: number; lng: number }> = {
    "St Austell": { "lat": 50.338466, "lng": -4.7882104 },
    "Luton": { "lat": 51.8784385, "lng": -0.4152837 },
    "Aylesbury": { "lat": 51.8161412, "lng": -0.8130383 },
    "Basildon": { "lat": 51.5702375, "lng": 0.4583573 },
    "Fareham": { "lat": 50.8526637, "lng": -1.1783134 },
    "Oxford": { "lat": 51.7520131, "lng": -1.2578499 },
    "Walsall": { "lat": 52.5847949, "lng": -1.9822687 },
    "Dartford": { "lat": 51.4443059, "lng": 0.21807 },
    "Orpington": { "lat": 51.3796373, "lng": 0.1053732 },
    "Bradford": { "lat": 53.7944229, "lng": -1.7519186 },
    "Colchester": { "lat": 51.8896903, "lng": 0.8994651 },
    "Doncaster": { "lat": 53.5227681, "lng": -1.1335312 },
    "Oldham": { "lat": 53.5415797, "lng": -2.1147831 },
    "Llandudno": { "lat": 53.322475, "lng": -3.8243251 },
    "Barrow-in-Furness": { "lat": 54.1288796, "lng": -3.2269008 },
    "Denton": { "lat": 53.4547745, "lng": -2.1153406 },
    "London": { "lat": 51.5074456, "lng": -0.1277653 },
    "Nottingham": { "lat": 52.9534193, "lng": -1.1496461 },
    "Swindon": { "lat": 51.5615327, "lng": -1.7854322 },
    "Mansfield": { "lat": 53.1443785, "lng": -1.1964165 },
    "Glasgow": { "lat": 55.861155, "lng": -4.2501687 },
    "Ealing": { "lat": 51.5126553, "lng": -0.3051952 },
    "Ealing, London": { "lat": 51.5126553, "lng": -0.3051952 },
    "Broughton": { "lat": 53.565614, "lng": -0.5539235 },
    "Broughton, Chester": { "lat": 53.1705, "lng": -2.9818 },
    "Liverpool": { "lat": 53.4071991, "lng": -2.99168 },
    "Didcot": { "lat": 51.6063587, "lng": -1.245999 },
    "Liskeard": { "lat": 50.4546303, "lng": -4.4644227 },
    "Swansea": { "lat": 51.6195955, "lng": -3.9459248 },
    "Leeds": { "lat": 53.7974185, "lng": -1.5437941 },
    "Paisley": { "lat": 55.8455828, "lng": -4.4239646 },
    "Norwich": { "lat": 52.6285576, "lng": 1.2923954 },
    "Ashford": { "lat": 51.148555, "lng": 0.8722566 },
    "York": { "lat": 53.9656579, "lng": -1.0743052 },
    "Cardiff": { "lat": 51.4816546, "lng": -3.1791934 },
    "Irvine": { "lat": 55.6131309, "lng": -4.6696399 },
    "Manchester": { "lat": 53.4794892, "lng": -2.2451148 },
    "Peterlee": { "lat": 54.7618912, "lng": -1.3321519 },
    "West Bromwich": { "lat": 52.5186579, "lng": -1.9923114 },
    "Edinburgh": { "lat": 55.9533456, "lng": -3.1883749 },
    "Edingburgh": { "lat": 55.9533456, "lng": -3.1883749 },
    "Tonbridge": { "lat": 51.1955494, "lng": 0.2750712 },
    "Bournemouth": { "lat": 50.7201514, "lng": -1.8799118 },
    "Coventry": { "lat": 52.4081812, "lng": -1.510477 },
    "Leicester": { "lat": 52.6362, "lng": -1.1331969 },
    "Truro": { "lat": 50.2633173, "lng": -5.0518107 },
    "Gloucester": { "lat": 51.8653705, "lng": -2.2458192 },
    "Gloucestershire": { "lat": 51.8653705, "lng": -2.2458192 },
    "Borehamwood": { "lat": 51.6555295, "lng": -0.2764051 },
    "Redditch": { "lat": 52.3057655, "lng": -1.9417444 },
    "Bury": { "lat": 52.2460367, "lng": 0.7125173 },
    "Bedford": { "lat": 52.1363806, "lng": -0.4675041 },
    "Ipswich": { "lat": 52.0579324, "lng": 1.1528095 },
    "Totton": { "lat": 50.9176659, "lng": -1.4830687 },
    "Lincoln": { "lat": 53.2293545, "lng": -0.5404819 },
    "Acton": { "lat": 51.5081402, "lng": -0.2732607 },
    "Acton, London": { "lat": 51.5081402, "lng": -0.2732607 },
    "Hayes": { "lat": 51.5077154, "lng": -0.4181471 },
    "Bognor Regis": { "lat": 50.7834973, "lng": -0.6730718 },
    "Kettering": { "lat": 52.3994233, "lng": -0.728004 },
    "Stevenage": { "lat": 51.9016663, "lng": -0.2027155 },
    "Stirling": { "lat": 56.1181242, "lng": -3.9360012 },
    "Darlington": { "lat": 54.5242081, "lng": -1.5555812 },
    "Consett": { "lat": 54.8518781, "lng": -1.8333741 },
    "Sawbridgeworth": { "lat": 51.8161034, "lng": 0.1478822 },
    "Milton Keynes": { "lat": 52.0406502, "lng": -0.7594092 },
    "Northampton": { "lat": 52.2343297, "lng": -0.9028043 },
    "Northamptonshire": { "lat": 52.2343297, "lng": -0.9028043 },
    "Banbury": { "lat": 52.0601807, "lng": -1.3402795 },
    "Aylesford": { "lat": 51.3093091, "lng": 0.4867332 },
    "Cheltenham": { "lat": 51.8995685, "lng": -2.0711559 },
    "Harlow": { "lat": 51.7685568, "lng": 0.0949036 },
    "Portsmouth": { "lat": 50.800031, "lng": -1.0906023 },
    "Ellesmere Port": { "lat": 53.2789347, "lng": -2.9022507 },
    "Ellesmere  Port": { "lat": 53.2789347, "lng": -2.9022507 }
}

/**
 * Calculates the Haversine distance between two points in miles.
 */
function getDistanceFromLatLonInMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 3958.8 // Radius of the earth in miles
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

/**
 * Validates a UK postcode format roughly.
 */
function isValidPostcode(p: string) {
    // Relaxed check to ensure we catch most candidates
    return /[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i.test(p)
}

export async function getLockerData(): Promise<LockerSite[]> {
    const filePath = path.join(process.cwd(), 'public', 'lockers.xlsx')
    console.log('[LockerLogic] Reading:', filePath)

    // Check if file exists to prevent hard crash if missing
    try {
        const fs = await import('fs')
        if (!fs.existsSync(filePath)) {
            console.error('[LockerLogic] File not found at:', filePath)
            return []
        }
    } catch (e) {
        console.warn('[LockerLogic] FS check failed, trying direct read')
    }

    const workbook = xlsx.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    console.log('[LockerLogic] Sheet:', sheetName)
    const sheet = workbook.Sheets[sheetName]

    // Header at row 5 (0-indexed)
    const rawData = xlsx.utils.sheet_to_json<any>(sheet, { range: 5 })
    console.log('[LockerLogic] Raw Rows:', rawData.length)

    const sites: LockerSite[] = []

    // Batch Postcode Lookup
    const postcodesToLookup = new Set<string>()

    rawData.forEach((row, index) => {
        const postcode = row['Postcode']?.toString().toUpperCase().trim()
        if (postcode && isValidPostcode(postcode)) {
            postcodesToLookup.add(postcode)
        }
    })

    console.log(`[LockerLogic] Found ${postcodesToLookup.size} unique postcodes to lookup`)

    const postcodeMap = await bulkGeocodePostcodes(Array.from(postcodesToLookup))

    for (let index = 0; index < rawData.length; index++) {
        const row = rawData[index]
        const name = row['Site: Site Name'] || `Site ${index}`
        const postcode = row['Postcode']?.toString().toUpperCase().trim()

        // Skip completely empty rows
        if (!name && !postcode && !row['City/Town']) continue

        const siteLat = postcode ? (postcodeMap[postcode]?.lat || null) : null
        const siteLng = postcode ? (postcodeMap[postcode]?.lng || null) : null

        const city = row['City/Town'] ? row['City/Town'].toString().trim() : 'Unknown'

        // Determine City Centre Location
        let cityLat = siteLat
        let cityLng = siteLng

        // Try to get hardcoded city coordinates
        const cityCoords = cityCache[city] || null
        if (cityCoords) {
            cityLat = cityCoords.lat
            cityLng = cityCoords.lng
        }

        let distance = 0
        if (siteLat && siteLng && cityLat && cityLng) {
            // If coordinates differ, calc distance
            if (Math.abs(siteLat - cityLat) > 0.0001 || Math.abs(siteLng - cityLng) > 0.0001) {
                distance = getDistanceFromLatLonInMiles(siteLat, siteLng, cityLat, cityLng)
            }
        }

        // Pricing Logic: Linear 
        // 0 miles -> £1600
        // 5 miles -> £900
        // >5 miles -> £900
        let price = 900
        if (distance < 5) {
            const priceDropPerMile = (1600 - 900) / 5 // 140
            price = 1600 - (distance * priceDropPerMile)
        }

        // Round to nearest 10
        price = Math.round(price / 10) * 10

        sites.push({
            id: `site-${index}`,
            name,
            address: row['Address Line 1'] || 'Unknown Address',
            city,
            postcode: postcode || 'N/A',
            spaces: Number(row['Number Of Spaces']) || 0,
            lat: siteLat,
            lng: siteLng,
            distanceToCentre: distance,
            price
        })
    }

    console.log(`[LockerLogic] Returned ${sites.length} sites`)

    return sites
}

async function bulkGeocodePostcodes(postcodes: string[]) {
    // postcodes.io allows batch lookups
    const results: Record<string, { lat: number, lng: number }> = {}

    // Chunk into 100s
    for (let i = 0; i < postcodes.length; i += 100) {
        const chunk = postcodes.slice(i, i + 100)
        try {
            const res = await fetch('https://api.postcodes.io/postcodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postcodes: chunk })
            })
            const data = await res.json()
            if (data.status === 200 && data.result) {
                // Check if result is array or what
                if (Array.isArray(data.result)) {
                    data.result.forEach((item: any) => {
                        if (item.result) { // item.result contains lat/long
                            results[item.query] = {
                                lat: item.result.latitude,
                                lng: item.result.longitude
                            }
                        }
                    })
                }
            }
        } catch (e) {
            console.error('Postcode lookup failed for chunk', chunk[0])
        }
    }
    return results
}
