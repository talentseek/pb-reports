"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Linkedin, Phone, Clock, CheckCheck } from "lucide-react"

// Mock inbox data
const mockMessages = [
    {
        id: 1,
        businessName: "The Oak Cafe",
        category: "Food and Drink",
        location: "SW1A 1AA",
        channel: "email",
        status: "sent",
        sentAt: "2 hours ago",
        preview: "Hi The Oak Cafe team, I noticed you're in SW1A 1AA. We've helped similar food and drink businesses...",
    },
    {
        id: 2,
        businessName: "Fitness First Gym",
        category: "Sports",
        location: "SW1A 1AA",
        channel: "linkedin",
        status: "sent",
        sentAt: "3 hours ago",
        preview: "Hi Fitness First Gym team, I noticed you're in SW1A 1AA. We've helped similar sports businesses...",
    },
    {
        id: 3,
        businessName: "Premier Inn",
        category: "Lodging (Hotels)",
        location: "SW1A 1AA",
        channel: "email",
        status: "sent",
        sentAt: "3 hours ago",
        preview: "Hi Premier Inn team, I noticed you're in SW1A 1AA. We've helped similar lodging (hotels) businesses...",
    },
    {
        id: 4,
        businessName: "Boots Pharmacy",
        category: "Health and Wellness",
        location: "SW1A 1AA",
        channel: "phone",
        status: "called",
        sentAt: "4 hours ago",
        preview: "Call logged - Left voicemail about validated parking program",
    },
    {
        id: 5,
        businessName: "Tesco Express",
        category: "Shopping (Retail)",
        location: "SW1A 1AA",
        channel: "linkedin",
        status: "sent",
        sentAt: "5 hours ago",
        preview: "Hi Tesco Express team, I noticed you're in SW1A 1AA. We've helped similar shopping (retail) businesses...",
    },
    {
        id: 6,
        businessName: "Dry Cleaners Plus",
        category: "Services",
        location: "SW1A 1AA",
        channel: "email",
        status: "sent",
        sentAt: "5 hours ago",
        preview: "Hi Dry Cleaners Plus team, I noticed you're in SW1A 1AA. We've helped similar services businesses...",
    },
]

function getChannelIcon(channel: string) {
    switch (channel) {
        case "email":
            return <Mail className="h-4 w-4" />
        case "linkedin":
            return <Linkedin className="h-4 w-4" />
        case "phone":
            return <Phone className="h-4 w-4" />
        default:
            return <Mail className="h-4 w-4" />
    }
}

function getStatusBadge(status: string) {
    switch (status) {
        case "sent":
            return <Badge variant="outline" className="text-xs"><CheckCheck className="h-3 w-3 mr-1" /> Sent</Badge>
        case "called":
            return <Badge variant="outline" className="text-xs"><Phone className="h-3 w-3 mr-1" /> Called</Badge>
        default:
            return <Badge variant="outline" className="text-xs">Sent</Badge>
    }
}

export default function InboxPage() {
    return (
        <main className="mx-auto max-w-7xl p-6 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">📬 Unified Inbox</h1>
                    <p className="text-muted-foreground mt-2">
                        All outreach messages and conversations in one place
                    </p>
                </div>
                <Link
                    href="/outreach"
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    ← Back to Outreach
                </Link>
            </header>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Sent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{mockMessages.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">📧 Email</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{mockMessages.filter(m => m.channel === "email").length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">💼 LinkedIn</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{mockMessages.filter(m => m.channel === "linkedin").length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">📞 Phone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{mockMessages.filter(m => m.channel === "phone").length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Messages List */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Outreach</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {mockMessages.map((message) => (
                            <div
                                key={message.id}
                                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="mt-1">
                                            {getChannelIcon(message.channel)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium">{message.businessName}</p>
                                                <Badge variant="secondary" className="text-xs">{message.category}</Badge>
                                                <span className="text-xs text-muted-foreground">• {message.location}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {message.preview}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                {getStatusBadge(message.status)}
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {message.sentAt}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Note about responses */}
            <Card className="bg-muted/50">
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">
                        💡 <strong>Note:</strong> Responses will appear here as businesses reply to your outreach messages.
                        Response tracking typically takes 24-72 hours to show meaningful data.
                    </p>
                </CardContent>
            </Card>
        </main>
    )
}
