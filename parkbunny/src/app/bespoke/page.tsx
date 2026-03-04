import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Lock, Copy } from 'lucide-react'

const BESPOKE_REPORTS = [
    {
        name: 'Buzz Bingo Portfolio',
        route: '/buzzbingoproposal',
        password: 'nexusbuzz2026',
        description: '23-site multi-stream revenue proposal with local offers uplift analysis',
        logo: '/buzzbingo.png',
        color: '#CE1126',
    },
    {
        name: 'NSL Proposal',
        route: '/nslproposal',
        password: 'nslpb2026',
        description: 'NSL parking management partnership proposal',
        logo: null,
        color: '#1e3a5f',
    },
    {
        name: 'ParkBee Proposal',
        route: '/parkbeeproposal',
        password: 'parkbeepb2026',
        description: 'ParkBee urban parking partnership proposal',
        logo: null,
        color: '#00c853',
    },
    {
        name: 'Nexus Locker',
        route: '/nexuslockerproposal',
        password: 'nexuspb2026',
        description: 'Smart locker deployment plan across portfolio sites',
        logo: '/groupnexus.jpeg',
        color: '#4f46e5',
    },
    {
        name: 'Jolly Sailor',
        route: '/jollysailor',
        password: 'jollysailor2026',
        description: 'Jolly Sailor marina revenue modelling report',
        logo: null,
        color: '#0284c7',
    },
    {
        name: 'Investor Deck',
        route: '/investordeck',
        password: 'parkbunny2026',
        description: 'ParkBunny investor presentation and pitch deck',
        logo: '/logo.png',
        color: '#f59e0b',
    },
]

export default async function BespokeReportsPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-5xl p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Bespoke Reports</h1>
                    <p className="text-gray-600 mt-1">Password-protected reports shared with external clients</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {BESPOKE_REPORTS.map((report) => (
                        <div
                            key={report.route}
                            className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                        >
                            {/* Colour bar */}
                            <div className="h-1.5" style={{ background: report.color }} />

                            <div className="p-5">
                                {/* Header */}
                                <div className="flex items-start gap-3 mb-3">
                                    {report.logo ? (
                                        <Image
                                            src={report.logo}
                                            alt={report.name}
                                            width={40}
                                            height={40}
                                            className="h-10 w-auto rounded object-contain"
                                            unoptimized
                                        />
                                    ) : (
                                        <div
                                            className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm"
                                            style={{ background: report.color }}
                                        >
                                            {report.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{report.name}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2">{report.description}</p>
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Lock className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-xs text-gray-500">Access Code</span>
                                        </div>
                                    </div>
                                    <code className="block mt-1 text-sm font-mono text-gray-800 select-all">
                                        {report.password}
                                    </code>
                                </div>

                                {/* Link */}
                                <Link
                                    href={report.route}
                                    target="_blank"
                                    className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-lg transition-colors text-white"
                                    style={{ background: report.color }}
                                >
                                    Open Report
                                    <ExternalLink className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
