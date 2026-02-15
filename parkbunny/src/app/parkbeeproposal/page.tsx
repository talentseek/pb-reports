import { getParkBeeData } from '@/lib/parkbee-logic'
import { fetchAllBuzzBingoPlaces } from '@/lib/buzzbingo-places'
import ClientProposal from './ClientProposal'

export const dynamic = 'force-dynamic'

export default async function ParkBeeProposalPage() {
    try {
        const sites = await getParkBeeData()
        const placesData = await fetchAllBuzzBingoPlaces(
            sites.map(s => ({ postcode: s.postcode, name: s.name }))
        )
        return <ClientProposal sites={sites} placesData={placesData} />
    } catch (error) {
        console.error('Error loading ParkBee data:', error)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-600">Error loading proposal data. Please try again.</p>
            </div>
        )
    }
}
