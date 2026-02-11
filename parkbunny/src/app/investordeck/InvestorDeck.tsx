'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
    Lock, Download, ChevronDown, ChevronUp,
    AlertTriangle, CheckCircle, ArrowRight,
    TrendingUp, DollarSign, Users, Building2,
    MapPin, Zap, Package, Monitor, Car,
    ShoppingBag, Globe, Mail, Rocket,
    Target, BarChart3, Handshake, Film,
    Sparkles, Shield
} from 'lucide-react'
import {
    DECK_PASSWORD, HERO, TRACTION, PROBLEM_DRIVERS, PROBLEM_OPERATORS,
    SOLUTION_DRIVERS, SOLUTION_OPERATORS, HOW_IT_WORKS, REVENUE_MODEL,
    PATH_TO_1M, ADDITIONAL_STREAMS, PARTNERS, TEAM, INVESTMENT,
    INTERNATIONAL
} from '@/lib/investor-data'

const TOTAL_SLIDES = 15

export default function InvestorDeck() {
    const [authed, setAuthed] = useState(false)
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (password === DECK_PASSWORD) {
            setAuthed(true)
            setError('')
        } else {
            setError('Incorrect access code')
        }
    }

    if (!authed) {
        return <LoginScreen password={password} setPassword={setPassword} error={error} onSubmit={handleLogin} />
    }

    return <DeckPresentation />
}

/* ═══════════════════════════════════════════
   LOGIN SCREEN
   ═══════════════════════════════════════════ */
function LoginScreen({ password, setPassword, error, onSubmit }: {
    password: string
    setPassword: (v: string) => void
    error: string
    onSubmit: (e: React.FormEvent) => void
}) {
    return (
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-[100px]" />

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Image src="/logo.png" alt="ParkBunny" width={180} height={56} className="h-14 w-auto rounded-lg" />
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-medium mb-4">
                            <Shield className="w-3 h-3" />
                            STRICTLY CONFIDENTIAL
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Investor Presentation</h1>
                        <p className="text-gray-400 text-sm">Enter the access code to view this deck</p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="password"
                                placeholder="Access Code"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all"
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold rounded-xl transition-all cursor-pointer"
                        >
                            View Presentation
                        </button>
                    </form>
                </div>

                <p className="text-center text-gray-600 text-xs mt-6">
                    © {new Date().getFullYear()} ParkBunny Ltd. All Rights Reserved.
                </p>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════
   DECK PRESENTATION
   ═══════════════════════════════════════════ */
function DeckPresentation() {
    const [currentSlide, setCurrentSlide] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const slideRefs = useRef<(HTMLElement | null)[]>([])

    const scrollToSlide = useCallback((index: number) => {
        slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    // Track current slide via Intersection Observer
    useEffect(() => {
        const observers: IntersectionObserver[] = []
        slideRefs.current.forEach((ref, i) => {
            if (!ref) return
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setCurrentSlide(i) },
                { threshold: 0.5 }
            )
            obs.observe(ref)
            observers.push(obs)
        })
        return () => observers.forEach(o => o.disconnect())
    }, [])

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault()
                const next = Math.min(currentSlide + 1, TOTAL_SLIDES - 1)
                scrollToSlide(next)
            }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault()
                const prev = Math.max(currentSlide - 1, 0)
                scrollToSlide(prev)
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [currentSlide, scrollToSlide])

    const setSlideRef = (index: number) => (el: HTMLElement | null) => {
        slideRefs.current[index] = el
    }

    return (
        <div ref={containerRef} className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth bg-[#0B1120]">
            {/* Navigation dots */}
            <nav className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 hidden md:flex">
                {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => scrollToSlide(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${i === currentSlide ? 'bg-amber-500 scale-125' : 'bg-white/20 hover:bg-white/40'
                            }`}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </nav>

            {/* Slide counter */}
            <div className="fixed bottom-4 left-4 z-50 text-gray-500 text-sm font-mono">
                {String(currentSlide + 1).padStart(2, '0')} / {TOTAL_SLIDES}
            </div>

            {/* Download PDF button */}
            <a
                href="/ParkBunny-Investor-Deck-V6-JANUARY26.pdf"
                download
                className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm rounded-full transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
            >
                <Download className="w-4 h-4" />
                Download PDF
            </a>

            {/* ═══ SLIDE 1: COVER ═══ */}
            <Slide ref={setSlideRef(0)}>
                <div className="flex flex-col items-center justify-center text-center relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]" />
                    <div className="relative z-10">
                        <FadeIn>
                            <Image src="/logo.png" alt="ParkBunny" width={200} height={64} className="h-14 w-auto mx-auto mb-6 rounded-lg" />
                        </FadeIn>
                        <FadeIn delay={200}>
                            <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 leading-tight">
                                {HERO.headline}
                            </h1>
                        </FadeIn>
                        <FadeIn delay={400}>
                            <p className="text-xl md:text-2xl text-amber-400 font-medium mb-2">{HERO.subheadline}</p>
                            <p className="text-gray-400 mb-8">{HERO.tagline}</p>
                        </FadeIn>
                        <FadeIn delay={600}>
                            <div className="flex flex-wrap justify-center gap-6">
                                <MetricPill label="Live Sites" value={TRACTION.liveSites} />
                                <MetricPill label="Pipeline" value={TRACTION.pipeline} />
                                <MetricPill label="Raising" value={HERO.raiseAmount} accent />
                                <MetricPill label="Valuation" value={HERO.valuation} />
                            </div>
                        </FadeIn>
                        <FadeIn delay={800}>
                            <button onClick={() => scrollToSlide(1)} className="mt-8 animate-bounce cursor-pointer">
                                <ChevronDown className="w-8 h-8 text-gray-500" />
                            </button>
                        </FadeIn>
                    </div>
                </div>
            </Slide>

            {/* ═══ SLIDE 2: THE PROBLEM ═══ */}
            <Slide ref={setSlideRef(1)}>
                <SlideHeader number="01" title="The Problem" subtitle="Traditional parking apps have frustrated both drivers and operators for years" />
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <FadeIn>
                        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                <h3 className="text-lg font-semibold text-red-400">For Drivers</h3>
                            </div>
                            <ul className="space-y-3">
                                {PROBLEM_DRIVERS.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-300">
                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </FadeIn>
                    <FadeIn delay={200}>
                        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                <h3 className="text-lg font-semibold text-red-400">For Operators & Shopping Centres</h3>
                            </div>
                            <ul className="space-y-3">
                                {PROBLEM_OPERATORS.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-300">
                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </FadeIn>
                </div>
            </Slide>

            {/* ═══ SLIDE 3: THE SOLUTION ═══ */}
            <Slide ref={setSlideRef(2)}>
                <SlideHeader number="02" title="The Solution" subtitle="ParkBunny turns every parking session into an engagement opportunity" />
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <FadeIn>
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-lg font-semibold text-emerald-400">For Drivers</h3>
                            </div>
                            <ul className="space-y-3">
                                {SOLUTION_DRIVERS.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </FadeIn>
                    <FadeIn delay={200}>
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-lg font-semibold text-emerald-400">For Operators</h3>
                            </div>
                            <ul className="space-y-3">
                                {SOLUTION_OPERATORS.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </FadeIn>
                </div>
            </Slide>

            {/* ═══ SLIDE 4: HOW IT WORKS ═══ */}
            <Slide ref={setSlideRef(3)}>
                <SlideHeader number="03" title="How It Works" subtitle="Three simple steps that create value for everyone" />
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mt-12">
                    {HOW_IT_WORKS.map((step, i) => (
                        <React.Fragment key={step.step}>
                            <FadeIn delay={i * 200}>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center flex-1 w-full md:w-auto">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center text-black text-2xl font-bold">
                                        {step.step}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                    <p className="text-gray-400 text-sm">{step.description}</p>
                                </div>
                            </FadeIn>
                            {i < HOW_IT_WORKS.length - 1 && (
                                <ArrowRight className="w-6 h-6 text-amber-500/40 shrink-0 rotate-90 md:rotate-0" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </Slide>

            {/* ═══ SLIDE 5: BUSINESS ACTIVATION ═══ */}
            <Slide ref={setSlideRef(4)}>
                <SlideHeader number="04" title="Nearby Business Activation" subtitle="A win-win ecosystem: more customers, more footfall, more revenue" />
                <div className="mt-8">
                    <FadeIn>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                            {/* Hub and spoke layout */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                {[
                                    { icon: <ShoppingBag className="w-6 h-6" />, label: 'Retail Discounts', desc: '20% off at local shops' },
                                    { icon: <Building2 className="w-6 h-6" />, label: 'Hotels & B&Bs', desc: '25% off parking for guests' },
                                    { icon: <Users className="w-6 h-6" />, label: 'Gym Members', desc: 'Discounted sessions' },
                                    { icon: <Package className="w-6 h-6" />, label: 'B2B Lockers', desc: '£8,400/yr revenue' },
                                    { icon: <Car className="w-6 h-6" />, label: 'Car Wash', desc: '£12,000/yr revenue' },
                                    { icon: <Monitor className="w-6 h-6" />, label: 'Co-Working', desc: 'Member parking deals' },
                                ].map((item, i) => (
                                    <FadeIn key={i} delay={i * 100}>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:border-amber-500/30 transition-colors">
                                            <div className="w-12 h-12 mx-auto mb-3 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                                                {item.icon}
                                            </div>
                                            <p className="text-white font-medium text-sm">{item.label}</p>
                                            <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
                                        </div>
                                    </FadeIn>
                                ))}
                            </div>
                            <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-4">
                                <p className="text-amber-400 font-medium text-sm">
                                    Drivers receive instant deals the moment they park. Local retailers gain new customers daily. Operators fill empty spaces through targeted B2B partnerships.
                                </p>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </Slide>

            {/* ═══ SLIDE 6: TRACTION ═══ */}
            <Slide ref={setSlideRef(5)}>
                <SlideHeader number="05" title="Traction & Pipeline" subtitle="Already live, already transacting — ready to scale fast" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                    {[
                        { value: TRACTION.liveSites, label: 'Live Locations', sub: 'Activated & transacting', icon: <MapPin className="w-5 h-5" /> },
                        { value: TRACTION.pipeline, label: 'Pipeline Sites', sub: 'National operators', icon: <Target className="w-5 h-5" /> },
                        { value: TRACTION.councilCoverage, label: 'UK Councils', sub: 'Coverage via NSL', icon: <Shield className="w-5 h-5" /> },
                        { value: TRACTION.shoppingCentres, label: 'Shopping Centres', sub: 'In network', icon: <Building2 className="w-5 h-5" /> },
                        { value: TRACTION.retailers, label: 'Retailers', sub: 'Independent network', icon: <ShoppingBag className="w-5 h-5" /> },
                        { value: TRACTION.monthOnMonthGrowth, label: 'MoM Growth', sub: 'Oct → Nov revenue', icon: <TrendingUp className="w-5 h-5" /> },
                    ].map((metric, i) => (
                        <FadeIn key={i} delay={i * 100}>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-amber-500/20 transition-colors">
                                <div className="w-10 h-10 mx-auto mb-3 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                                    {metric.icon}
                                </div>
                                <p className="text-3xl md:text-4xl font-bold text-white">{metric.value}</p>
                                <p className="text-gray-300 text-sm font-medium mt-1">{metric.label}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{metric.sub}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </Slide>

            {/* ═══ SLIDE 7: REVENUE MODEL ═══ */}
            <Slide ref={setSlideRef(6)}>
                <SlideHeader number="06" title="Revenue Model" subtitle="Multiple revenue streams from every parking session" />
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <FadeIn>
                        <div className="space-y-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-amber-400" />
                                    Per-Session Revenue
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Transaction fee</span>
                                        <span className="text-white font-bold text-lg">{REVENUE_MODEL.perSession}</span>
                                    </div>
                                    <div className="border-t border-white/5" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Retailer subscription</span>
                                        <span className="text-white font-bold">{REVENUE_MODEL.rewardsSubscription}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-blue-400" />
                                    Revenue per Site Type
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Shopping Centre</span>
                                        <span className="text-emerald-400 font-bold text-lg">{REVENUE_MODEL.shoppingCentreAnnual}/yr</span>
                                    </div>
                                    <div className="border-t border-white/5" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Pay & Display (per 100 spaces)</span>
                                        <span className="text-emerald-400 font-bold">{REVENUE_MODEL.payAndDisplayAnnual}/yr</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={200}>
                        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl p-6 h-full flex flex-col justify-center">
                            <p className="text-amber-400 text-sm font-medium mb-2">Projected Annual Net Revenue</p>
                            <p className="text-5xl font-bold text-white mb-4">{REVENUE_MODEL.projectedNetRevenue}</p>
                            <p className="text-gray-400 text-sm mb-6">From current pipeline of 150+ sites</p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Current Monthly Rev</span>
                                    <span className="text-white font-medium">{REVENUE_MODEL.currentMonthlyRev}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Monthly Overhead</span>
                                    <span className="text-white font-medium">{REVENUE_MODEL.overheadMonthly}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-amber-500/20 pt-2">
                                    <span className="text-amber-400 font-medium">Breakeven Target</span>
                                    <span className="text-amber-400 font-bold">{REVENUE_MODEL.breakeven}</span>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </Slide>

            {/* ═══ SLIDE 8: PATH TO £1M ═══ */}
            <Slide ref={setSlideRef(7)}>
                <SlideHeader number="07" title="Path to £1M" subtitle="Scalable, realistic mix of high-value assets" />
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <FadeIn>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-white font-semibold mb-4">Revenue Mix Target</h3>
                            <div className="space-y-4">
                                {PATH_TO_1M.mix.map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-400">{item.type}</span>
                                            <span className="text-white font-medium">{item.revenue}</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                                                style={{ width: `${(parseInt(item.revenue.replace(/[£,]/g, '')) / 307500) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t border-white/10 pt-3 flex justify-between">
                                    <span className="text-amber-400 font-semibold">Total</span>
                                    <span className="text-amber-400 font-bold text-xl">{PATH_TO_1M.target}</span>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={200}>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-white font-semibold mb-4">Breakeven Pipeline Snapshot</h3>
                            <div className="space-y-2">
                                {PATH_TO_1M.breakevenPipeline.map((site, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                        <div>
                                            <p className="text-gray-300 text-sm">{site.name}</p>
                                            <p className="text-gray-500 text-xs">{site.type}</p>
                                        </div>
                                        <span className="text-emerald-400 font-medium text-sm">{site.revenue}/mo</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </Slide>

            {/* ═══ SLIDE 9: ADDITIONAL REVENUE ═══ */}
            <Slide ref={setSlideRef(8)}>
                <SlideHeader number="08" title="Additional Revenue Streams" subtitle="It's so much more than parking — multiple passive income opportunities" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                    {ADDITIONAL_STREAMS.map((stream, i) => {
                        const icons = [
                            <Package key="pkg" className="w-6 h-6" />,
                            <Monitor key="mon" className="w-6 h-6" />,
                            <Car key="car" className="w-6 h-6" />,
                            <Film key="film" className="w-6 h-6" />,
                            <ShoppingBag key="shop" className="w-6 h-6" />,
                            <Zap key="zap" className="w-6 h-6" />,
                        ]
                        return (
                            <FadeIn key={i} delay={i * 100}>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-amber-500/20 transition-colors">
                                    <div className="w-10 h-10 mb-3 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                                        {icons[i]}
                                    </div>
                                    <p className="text-white font-semibold text-sm">{stream.name}</p>
                                    <p className="text-amber-400 font-bold text-lg mt-1">{stream.annual}</p>
                                    <p className="text-gray-500 text-xs mt-1">{stream.detail}</p>
                                </div>
                            </FadeIn>
                        )
                    })}
                </div>
            </Slide>

            {/* ═══ SLIDE 10: AI & TECHNOLOGY ═══ */}
            <Slide ref={setSlideRef(9)}>
                <SlideHeader number="09" title="AI & Technology" subtitle="AI-Powered Revenue Optimisation" />
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <FadeIn>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-400" />
                                AI Activation Strategy
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    'Identifies high-value nearby businesses automatically',
                                    'Recommends targeted deals based on time of day & driver behaviour',
                                    'Suggests dynamic pricing to maximise occupancy',
                                    'Supports retailer outreach and onboarding',
                                    'Drives personalised engagement to improve deal redemption',
                                    'Every site launches with pre-activated partners',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </FadeIn>

                    <FadeIn delay={200}>
                        <div className="space-y-4">
                            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
                                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                                    <Rocket className="w-5 h-5 text-blue-400" />
                                    Proprietary AI Outreach
                                </h3>
                                <p className="text-gray-400 text-sm mb-3">ParkBunny owns a share in an AI Agency</p>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <p className="text-blue-400 font-bold text-lg">b2bee.ai</p>
                                    <p className="text-gray-400 text-sm">Provides proprietary outreach tools that automate retailer acquisition at scale</p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-white font-semibold mb-3">The Flywheel</h3>
                                <div className="flex items-center justify-between">
                                    {['Empty Spaces\nMonetised', 'Local Businesses\nGain Customers', 'Drivers Get\nRewarded'].map((text, i) => (
                                        <React.Fragment key={i}>
                                            <div className="text-center">
                                                <div className="w-16 h-16 mx-auto mb-2 bg-amber-500/10 rounded-full flex items-center justify-center">
                                                    {[<MapPin key="mp" className="w-6 h-6 text-amber-400" />, <Handshake key="hs" className="w-6 h-6 text-emerald-400" />, <Users key="us" className="w-6 h-6 text-blue-400" />][i]}
                                                </div>
                                                <p className="text-gray-300 text-xs whitespace-pre-line">{text}</p>
                                            </div>
                                            {i < 2 && <ArrowRight className="w-4 h-4 text-gray-600 shrink-0" />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </Slide>

            {/* ═══ SLIDE 11: STRATEGIC PARTNERS ═══ */}
            <Slide ref={setSlideRef(10)}>
                <SlideHeader number="10" title="Strategic Partners" subtitle="It's all about relationships — national operators already in the pipeline" />
                <div className="mt-8">
                    <FadeIn>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {PARTNERS.map((partner, i) => (
                                <FadeIn key={i} delay={i * 80}>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-amber-500/20 transition-colors">
                                        <p className="text-white font-semibold">{partner.name}</p>
                                        <p className="text-gray-500 text-xs mt-1">{partner.description}</p>
                                        {partner.sites && (
                                            <p className="text-amber-400/80 text-xs mt-2 font-medium">{partner.sites}</p>
                                        )}
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </FadeIn>
                    <FadeIn delay={400}>
                        <div className="mt-6 bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-xl p-4">
                            <p className="text-blue-400 font-medium text-sm flex items-center gap-2">
                                <Handshake className="w-4 h-4" />
                                2026 White-Label: Councils & large operators can run ParkBunny under their own brand with full backend
                            </p>
                        </div>
                    </FadeIn>
                </div>
            </Slide>

            {/* ═══ SLIDE 12: MARKET OPPORTUNITY ═══ */}
            <Slide ref={setSlideRef(11)}>
                <SlideHeader number="11" title="Market Opportunity" subtitle="A massive, untapped market with zero loyalty competitors" />
                <div className="mt-8 text-center">
                    <FadeIn>
                        <div className="mb-8">
                            <p className="text-7xl md:text-9xl font-bold text-white">{TRACTION.ukCarParks}</p>
                            <p className="text-xl text-gray-400 mt-2">Car Parks in the UK</p>
                        </div>
                    </FadeIn>
                    <FadeIn delay={200}>
                        <div className="mb-10">
                            <p className="text-4xl md:text-6xl font-bold text-amber-400">{TRACTION.dailyParkingEvents}</p>
                            <p className="text-lg text-gray-400 mt-2">Daily parking events — with zero rewards</p>
                        </div>
                    </FadeIn>
                    <FadeIn delay={400}>
                        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <p className="text-emerald-400 font-bold text-lg">Proven</p>
                                <p className="text-gray-500 text-xs">at 40+ sites, ready to scale</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <p className="text-amber-400 font-bold text-lg">1% capture</p>
                                <p className="text-gray-500 text-xs">= a high-margin, scalable business</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <p className="text-blue-400 font-bold text-lg">Zero</p>
                                <p className="text-gray-500 text-xs">direct loyalty competitors</p>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </Slide>

            {/* ═══ SLIDE 13: THE TEAM ═══ */}
            <Slide ref={setSlideRef(12)}>
                <SlideHeader number="12" title="The Team" subtitle="Experienced founders who've already done this at scale" />
                <FadeIn>
                    <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-4 mt-4 mb-6">
                        <p className="text-amber-400 text-sm font-medium">
                            &ldquo;Pipeline acquisition is a solved problem — we&apos;ve already done it before at scale.&rdquo;
                            <span className="text-gray-500"> — Jon Sprank, CEO</span>
                        </p>
                    </div>
                </FadeIn>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {TEAM.map((member, i) => (
                        <FadeIn key={i} delay={i * 100}>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-amber-500/20 transition-colors">
                                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-black font-bold text-xl">
                                    {member.initials}
                                </div>
                                <p className="text-white font-semibold text-sm">{member.name}</p>
                                <p className="text-amber-400 text-xs font-medium mt-0.5">{member.role}</p>
                                <ul className="mt-3 space-y-1 text-left">
                                    {member.credentials.map((cred, j) => (
                                        <li key={j} className="text-gray-400 text-xs flex items-start gap-1.5">
                                            <span className="w-1 h-1 bg-gray-500 rounded-full mt-1.5 shrink-0" />
                                            {cred}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </Slide>

            {/* ═══ SLIDE 14: THE ASK ═══ */}
            <Slide ref={setSlideRef(13)}>
                <SlideHeader number="13" title="The Investment Ask" subtitle="We're raising £1M to accelerate growth" />
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <FadeIn>
                        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl p-8 flex flex-col justify-center">
                            <p className="text-sm text-amber-400 font-medium mb-2">Seeking</p>
                            <p className="text-6xl font-bold text-white mb-2">{INVESTMENT.amount}</p>
                            <p className="text-gray-400 mb-6">
                                for {INVESTMENT.equity} equity at {INVESTMENT.valuation}
                            </p>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <p className="text-gray-400 text-sm">Also open to</p>
                                <p className="text-white font-semibold">{INVESTMENT.alternative}</p>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={200}>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-white font-semibold mb-4">Use of Funds</h3>
                            <div className="space-y-4">
                                {INVESTMENT.useOfFunds.map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-400">{item.label}</span>
                                            <span className="text-white font-medium">{item.percent}%</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-2.5">
                                            <div
                                                className="h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-1000"
                                                style={{ width: `${item.percent}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/10">
                                <p className="text-emerald-400 text-sm font-medium">
                                    We&apos;re revenue-generating, and ready to scale.
                                </p>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </Slide>

            {/* ═══ SLIDE 15: CONTACT ═══ */}
            <Slide ref={setSlideRef(14)}>
                <div className="flex flex-col items-center justify-center text-center h-full">
                    <FadeIn>
                        <Image src="/logo.png" alt="ParkBunny" width={200} height={64} className="h-14 w-auto mx-auto mb-6 rounded-lg" />
                    </FadeIn>
                    <FadeIn delay={200}>
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
                            Join the Parking<br />Revolution
                        </h2>
                    </FadeIn>
                    <FadeIn delay={400}>
                        <p className="text-xl text-gray-400 max-w-lg mb-8">
                            Your investment accelerates our expansion into hundreds of sites and millions of driver interactions
                        </p>
                    </FadeIn>
                    <FadeIn delay={600}>
                        <a
                            href="mailto:jon@parkbunny.app"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-lg rounded-2xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                        >
                            <Mail className="w-5 h-5" />
                            Contact Jon Sprank
                        </a>
                        <p className="text-gray-500 text-sm mt-3">jon@parkbunny.app</p>
                    </FadeIn>
                    <FadeIn delay={800}>
                        <div className="mt-12 flex items-center gap-6 text-gray-500">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                <span className="text-sm">International expansion: LA & Europe — 2026</span>
                            </div>
                        </div>
                    </FadeIn>
                    <div className="absolute bottom-8 text-center">
                        <p className="text-gray-600 text-xs">
                            Strictly Private and Confidential. © {new Date().getFullYear()} ParkBunny Ltd. All Rights Reserved.
                        </p>
                    </div>
                </div>
            </Slide>
        </div>
    )
}

/* ═══════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════ */

const Slide = React.forwardRef<HTMLElement, { children: React.ReactNode }>(
    function SlideInner({ children }, ref) {
        return (
            <section
                ref={ref}
                className="min-h-screen snap-start flex items-center relative px-4 md:px-12 py-12"
            >
                <div className="w-full max-w-6xl mx-auto">
                    {children}
                </div>
            </section>
        )
    }
)

function SlideHeader({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
    return (
        <FadeIn>
            <div>
                <span className="text-amber-500/60 font-mono text-sm">{number}</span>
                <h2 className="text-3xl md:text-5xl font-bold text-white mt-1">{title}</h2>
                <p className="text-gray-400 mt-2 text-lg">{subtitle}</p>
            </div>
        </FadeIn>
    )
}

function MetricPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className={`px-6 py-3 rounded-full border ${accent
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : 'bg-white/5 border-white/10 text-white'
            }`}>
            <span className="text-xs text-gray-400 block">{label}</span>
            <span className="text-lg font-bold">{value}</span>
        </div>
    )
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
            { threshold: 0.1 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [])

    return (
        <div
            ref={ref}
            className="transition-all duration-700 ease-out"
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: `${delay}ms`,
            }}
        >
            {children}
        </div>
    )
}
