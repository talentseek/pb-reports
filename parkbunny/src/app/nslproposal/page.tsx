import { getNSLData, type NSLSite } from '@/lib/nsl-logic'
import { fetchAllBuzzBingoPlaces, type PostcodePlaces } from '@/lib/buzzbingo-places'
import ClientProposal from './ClientProposal'

export const dynamic = 'force-dynamic'

export default async function NSLProposalPage() {
    let siteData: NSLSite[] = []
    let placesData: PostcodePlaces[] = []
    let errorMsg = ''

    try {
        siteData = await getNSLData()
        // Fetch Places data for all sites
        placesData = await fetchAllBuzzBingoPlaces(
            siteData.map(s => ({ postcode: s.postcode, name: s.name }))
        )
    } catch (e: any) {
        console.error('Failed to load NSL data', e)
        errorMsg = e.message || 'Unknown error'
    }

    if (errorMsg) {
        return (
            <main className="flex-1 flex items-center justify-center p-8">
                <p className="text-red-500">Error loading data: {errorMsg}</p>
            </main>
        )
    }

    return <ClientProposal data={siteData} placesData={placesData} />
}
