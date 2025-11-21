"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, Mail, Phone, Linkedin, TrendingUp } from "lucide-react"

type Business = {
    id: string
    name: string
    category: string
    address: string | null
    website: string | null
}

type AIOutreachClientProps = {
    locationId: string
    postcode: string
    reportName: string
    businesses: Business[]
}

export default function AIOutreachClient({ locationId, postcode, reportName, businesses }: AIOutreachClientProps) {
    const [step, setStep] = useState<'discovery' | 'enrichment' | 'outreach' | 'stats'>('discovery')
    const [enrichedCount, setEnrichedCount] = useState(0)
    const [contactedCount, setContactedCount] = useState(0)
    const [showStats, setShowStats] = useState(false)

    // Auto-progress through steps
    useEffect(() => {
        const timer1 = setTimeout(() => {
            setStep('enrichment')
        }, 2000)

        const timer2 = setTimeout(() => {
            setStep('outreach')
        }, 8000)

        const timer3 = setTimeout(() => {
            setStep('stats')
            setShowStats(true)
        }, 14000)

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
        }
    }, [])

    // Simulate enrichment progress
    useEffect(() => {
        if (step === 'enrichment') {
            const interval = setInterval(() => {
                setEnrichedCount(prev => {
                    if (prev < businesses.length) {
                        return prev + 1
                    }
                    return prev
                })
            }, 300)
            return () => clearInterval(interval)
        }
    }, [step, businesses.length])

    // Simulate outreach progress
    useEffect(() => {
        if (step === 'outreach') {
            const interval = setInterval(() => {
                setContactedCount(prev => {
                    if (prev < businesses.length) {
                        return prev + 1
                    }
                    return prev
                })
            }, 200)
            return () => clearInterval(interval)
        }
    }, [step, businesses.length])

    const enrichmentProgress = (enrichedCount / businesses.length) * 100
    const outreachProgress = (contactedCount / businesses.length) * 100

    // Mock stats - contact method breakdown
    const contactedViaEmail = Math.floor(businesses.length * 0.7)
    const contactedViaLinkedIn = Math.floor(businesses.length * 0.5)
    const contactedViaPhone = Math.floor(businesses.length * 0.3)

    return (
        <main className="mx-auto max-w-7xl p-6 space-y-6">
            <header>
                <div className="flex items-center gap-4">
                    <Link
                        href="/outreach"
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        ← Back to Outreach
                    </Link>
                </div>
                <h1 className="text-3xl font-bold mt-2">🤖 AI Outreach Campaign: {postcode}</h1>
                <p className="text-muted-foreground">
                    {reportName} • Automated business discovery, enrichment, and outreach
                </p>
            </header>

            {/* Progress Steps */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={step === 'discovery' ? 'border-primary' : ''}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            {step === 'discovery' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                            <div>
                                <p className="font-medium">Discovery</p>
                                <p className="text-sm text-muted-foreground">{businesses.length} businesses</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={step === 'enrichment' ? 'border-primary' : ''}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            {step === 'discovery' ? (
                                <div className="h-5 w-5 rounded-full bg-gray-200" />
                            ) : step === 'enrichment' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                            <div>
                                <p className="font-medium">AI Enrichment</p>
                                <p className="text-sm text-muted-foreground">{enrichedCount} / {businesses.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={step === 'outreach' ? 'border-primary' : ''}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            {['discovery', 'enrichment'].includes(step) ? (
                                <div className="h-5 w-5 rounded-full bg-gray-200" />
                            ) : step === 'outreach' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                            <div>
                                <p className="font-medium">Outreach</p>
                                <p className="text-sm text-muted-foreground">{contactedCount} contacted</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={step === 'stats' ? 'border-primary' : ''}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            {step === 'stats' ? (
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : (
                                <div className="h-5 w-5 rounded-full bg-gray-200" />
                            )}
                            <div>
                                <p className="font-medium">Complete</p>
                                <p className="text-sm text-muted-foreground">Campaign sent</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Discovery Phase */}
            {step === 'discovery' && (
                <Card>
                    <CardHeader>
                        <CardTitle>🔍 Discovering Businesses...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="text-center text-muted-foreground">
                                AI scanning local businesses in {postcode}...
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-4">
                                {businesses.slice(0, 6).map((business, idx) => (
                                    <div key={idx} className="text-sm p-2 border rounded bg-muted/50">
                                        ✓ {business.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Enrichment Phase */}
            {step === 'enrichment' && (
                <Card>
                    <CardHeader>
                        <CardTitle>🤖 AI Enrichment in Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Progress value={enrichmentProgress} className="h-3" />
                        <p className="text-sm text-muted-foreground text-center">
                            Enriching {enrichedCount} of {businesses.length} businesses...
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {businesses.slice(0, enrichedCount).map((business, idx) => (
                                <div key={idx} className="p-3 border rounded space-y-2">
                                    <div className="flex items-start justify-between">
                                        <p className="font-medium text-sm">{business.name}</p>
                                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    </div>
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                        <div>✓ Contact details found</div>
                                        <div>✓ Social media analyzed</div>
                                        <div>✓ Decision maker identified</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Outreach Phase */}
            {step === 'outreach' && (
                <Card>
                    <CardHeader>
                        <CardTitle>📧 Personalized Outreach in Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Progress value={outreachProgress} className="h-3" />
                        <p className="text-sm text-muted-foreground text-center">
                            Contacted {contactedCount} of {businesses.length} businesses with AI-generated messages...
                        </p>
                        <div className="space-y-3">
                            {businesses.slice(0, 3).map((business, idx) => (
                                <Card key={idx} className="bg-muted/30">
                                    <CardContent className="pt-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium">{business.name}</p>
                                            <div className="flex gap-1">
                                                <Badge variant="outline" className="text-xs"><Mail className="h-3 w-3" /></Badge>
                                                <Badge variant="outline" className="text-xs"><Linkedin className="h-3 w-3" /></Badge>
                                            </div>
                                        </div>
                                        <div className="text-sm bg-white p-3 rounded border">
                                            <p className="text-muted-foreground italic">
                                                &quot;Hi {business.name} team, I noticed you&apos;re in {postcode}. We&apos;ve helped similar {business.category.toLowerCase()} businesses increase customer retention by 25% through our validated parking program...&quot;
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Dashboard */}
            {showStats && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">📊 Outreach Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Contacted</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{businesses.length}</p>
                                <p className="text-xs text-muted-foreground mt-1">100% coverage</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground">📧 Email</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{contactedViaEmail}</p>
                                <p className="text-xs text-muted-foreground mt-1">Messages sent</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground">💼 LinkedIn</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{contactedViaLinkedIn}</p>
                                <p className="text-xs text-muted-foreground mt-1">Messages sent</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground">📞 Phone</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{contactedViaPhone}</p>
                                <p className="text-xs text-muted-foreground mt-1">Calls logged</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Businesses Contacted by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Array.from(new Set(businesses.map(b => b.category))).slice(0, 5).map((category, idx) => {
                                    const count = businesses.filter(b => b.category === category).length
                                    const contactMethods = idx % 3 === 0 ? '📧 💼' : idx % 3 === 1 ? '📧 📞' : '💼 📞'
                                    return (
                                        <div key={category} className="flex items-center justify-between p-2 border rounded">
                                            <div>
                                                <p className="font-medium text-sm">{category}</p>
                                                <p className="text-xs text-muted-foreground">{count} businesses contacted</p>
                                            </div>
                                            <Badge variant="secondary">{contactMethods}</Badge>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </main>
    )
}
