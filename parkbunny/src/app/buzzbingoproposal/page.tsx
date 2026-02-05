import { getBuzzBingoData, type BuzzBingoSite } from '@/lib/buzzbingo-logic'
import ClientProposal from './ClientProposal'

export const dynamic = 'force-dynamic'

export default async function BuzzBingoProposalPage() {
    let siteData: BuzzBingoSite[] = []
    let errorMsg = ''

    try {
        siteData = await getBuzzBingoData()
    } catch (e: any) {
        console.error('Failed to load Buzz Bingo data', e)
        errorMsg = e.message || 'Unknown error'
    }

    if (errorMsg) {
        return (
            <main className="flex-1 flex items-center justify-center p-8">
                <p className="text-red-500">Error loading data: {errorMsg}</p>
            </main>
        )
    }

    return <ClientProposal data={siteData} />
}
