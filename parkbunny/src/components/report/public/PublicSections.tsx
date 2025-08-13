import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export function ExecutiveAreaSummary() {
  return (
    <section className="space-y-3">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="w-full h-48 lg:h-56 flex items-center justify-center">
              <Image src="/newsites.png" alt="Local context" width={2000} height={2000} className="w-full h-full object-contain" />
            </div>
            <div className="lg:col-span-2">
              <CardTitle className="text-primary mb-4">Executive Summary of the Local Area</CardTitle>
              <p className="text-sm text-gray-700">The analyzed catchments present strong demand drivers across hospitality, fitness, and professional services. Weekday occupancy is shaped by nearby offices and co-working hubs; evenings and weekends benefit from restaurants and entertainment venues. Seasonal peaks (e.g., holidays, events) further lift demand. ParkBunny converts this latent demand via targeted partnerships and instant in‑app offers.</p>
              <p className="text-sm text-gray-700 mt-2">This narrative reflects observable local activity patterns and known anchors (e.g., visitor attractions, regular events, and transport hubs) to guide partnership prioritization and activation sequencing.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export function AppShowcase() {
  return (
    <section className="space-y-3">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader>
          <CardTitle className="text-primary">Smart Parking Management (App)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2">
              <p className="text-sm text-gray-700">
                Our platform enables multi‑location partnership management, centralized revenue tracking, and instant promotional
                tools that convert nearby demand into measurable parking revenue. Operators can create partner‑specific offers and
                validated parking links, schedule time‑of‑day incentives, and monitor uplift across sites with transparent
                reporting. Below is a mockup illustrating the operator console.
              </p>
            </div>
            <div className="w-full h-24 lg:h-28 flex items-center justify-center rounded overflow-hidden">
              <Image src="/dashboard.webp" alt="Dashboard mockup" width={3252} height={2096} className="w-full h-full object-contain" />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export function WhatMakesDifferent() {
  return (
    <section className="space-y-3">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="w-full h-24 lg:h-28 flex items-center justify-center">
              <Image src="/different.webp" alt="Why ParkBunny" width={2000} height={2000} className="w-full h-full object-contain" />
            </div>
            <div className="lg:col-span-2">
              <CardTitle className="text-primary mb-4">What Makes ParkBunny Different</CardTitle>
              <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
                <li>Beyond “pay and leave”: Instant Local Deals to reward drivers and lift merchant footfall</li>
                <li>Direct comms + real‑time control: target offers, adjust tariffs, view behaviour analytics across sites</li>
                <li>Multi‑location rollout: centralised partner management, signage, codes/validation, merchant onboarding</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export function ActivationPlan() {
  return (
    <section className="space-y-3">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <CardTitle className="text-primary mb-4">Activation Plan</CardTitle>
              <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
                <li>Weeks 0–2: site checks, signage assets, shortlist & outreach to top categories; enable validated/discounted links</li>
                <li>Weeks 3–4: first offers live; event‑aligned promos; test off‑peak pricing</li>
                <li>Weeks 5–6: expand partners; optimise offers by time of day; push loyalty nudges in‑app</li>
              </ul>
              <p className="text-xs text-gray-600 mt-2">Success metrics: +paid sessions vs. baseline, partner count, validation/redemption rate, repeat sessions, off‑peak fill.</p>
            </div>
            <div className="w-full h-24 lg:h-28 flex items-center justify-center order-1 lg:order-2">
              <Image src="/mockup.png" alt="Activation visuals" width={2000} height={2000} className="w-full h-full object-contain" />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export function MeasurementReporting() {
  return (
    <section className="space-y-3">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="w-full h-24 lg:h-28 flex items-center justify-center">
              <Image src="/dashboard.webp" alt="Reporting visuals" width={2000} height={2000} className="w-full h-full object-contain" />
            </div>
            <div className="lg:col-span-2">
              <CardTitle className="text-primary mb-4">Measurement & Reporting</CardTitle>
              <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
                <li>Core KPIs: paid sessions, conversion from partner clicks/validations, avg stay, yield by hour/day, repeat rate</li>
                <li>Partner KPIs: redemptions, new vs returning mix, top‑performing offers</li>
                <li>Operator dashboard: tariff edits, offer scheduling, multi‑site comparisons (monthly PDF + live)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export function ComplianceGoodPractice() {
  return (
    <section className="space-y-3">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <CardTitle className="text-primary mb-4">Compliance & Good Practice</CardTitle>
              <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
                <li>Clear signage & terms (Code of Practice alignment)</li>
                <li>Privacy: ANPR/CCTV and app data handled under UK GDPR/DPA; proportionate, transparent use</li>
              </ul>
            </div>
            <div className="w-full h-24 lg:h-28 flex items-center justify-center order-1 lg:order-2">
              <Image src="/compliance.webp" alt="Compliance visuals" width={2000} height={2000} className="w-full h-full object-contain" />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}


