import { getLockerData, type LockerSite } from '@/lib/locker-logic'
import ClientProposal from './ClientProposal'

export const dynamic = 'force-dynamic' // Ensure we calculate on request or revalidate logic

export default async function NexusLockerProposalPage() {
    let lockerData: LockerSite[] = []
    try {
        lockerData = await getLockerData()
    } catch (e) {
        console.error('Failed to load locker data', e)
    }

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            <ClientProposal initialData={lockerData} />
        </main>
    )
}
