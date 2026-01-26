import { getLockerData, type LockerSite } from '@/lib/locker-logic'
import ClientProposal from './ClientProposal'

export const dynamic = 'force-dynamic' // Ensure we calculate on request or revalidate logic

export default async function NexusLockerProposalPage() {
    let lockerData: LockerSite[] = []
    let errorMsg = ''
    try {
        lockerData = await getLockerData()
    } catch (e: any) {
        console.error('Failed to load locker data', e)
        errorMsg = e.message || 'Unknown error'
    }

    if (lockerData.length === 0) {
        return (
            <div className="p-10 text-center">
                <h1 className="text-2xl font-bold text-red-600">Data Load Error</h1>
                <p className="mt-4">0 Locations found.</p>
                {errorMsg && <p className="text-red-500">Error: {errorMsg}</p>}
                <p className="text-sm text-gray-500 mt-2">Server CWD: {process.cwd()}</p>
                <p className="text-sm text-gray-500">Please check server logs for [LockerLogic] entries.</p>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            <ClientProposal initialData={lockerData} />
        </main>
    )
}
