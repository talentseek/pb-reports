import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export function ExecutiveAreaSummary() {
  return (
    <section className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary of the Local Area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <p className="text-sm text-gray-700">The analyzed catchments present strong demand drivers across hospitality, fitness, and professional services. Weekday occupancy is shaped by nearby offices and co-working hubs; evenings and weekends benefit from restaurants and entertainment venues. Seasonal peaks (e.g., holidays, events) further lift demand. ParkBunny converts this latent demand via targeted partnerships and instant in-app offers.</p>
              <p className="text-sm text-gray-700 mt-2">This narrative can be generated from live POI context using OpenAI for location-specific insights (e.g., notable attractions, regular events, transport hubs) to guide partnership prioritization.</p>
            </div>
            <div className="rounded border bg-gray-100 w-full h-32 flex items-center justify-center text-gray-500">Area image</div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export function AppShowcase() {
  return (
    <section className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Smart Parking Management (App)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-3">Our platform enables multi-location partnership management, centralized revenue tracking, and instant promotional tools. Below are mockups illustrating the driver app and operator console.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded border overflow-hidden">
              <Image src="/mockup.png" alt="App mockup" width={1200} height={800} className="w-full h-64 object-cover" />
            </div>
            <div className="rounded border overflow-hidden">
              <Image src="/dashboard.webp" alt="Dashboard mockup" width={1200} height={800} className="w-full h-64 object-cover" />
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
      <Card>
        <CardHeader>
          <CardTitle>What Makes ParkBunny Different</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
            <li>Beyond “pay and leave”: Instant Local Deals to reward drivers and lift merchant footfall</li>
            <li>Direct comms + real‑time control: target offers, adjust tariffs, view behaviour analytics across sites</li>
            <li>Multi‑location rollout: centralised partner management, signage, codes/validation, merchant onboarding</li>
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}

export function ActivationPlan() {
  return (
    <section className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Activation Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
            <li>Weeks 0–2: site checks, signage assets, shortlist & outreach to top categories; enable validated/discounted links</li>
            <li>Weeks 3–4: first offers live; event‑aligned promos; test off‑peak pricing</li>
            <li>Weeks 5–6: expand partners; optimise offers by time of day; push loyalty nudges in‑app</li>
          </ul>
          <p className="text-xs text-gray-600 mt-2">Success metrics: +paid sessions vs. baseline, partner count, validation/redemption rate, repeat sessions, off‑peak fill.</p>
        </CardContent>
      </Card>
    </section>
  )
}

export function MeasurementReporting() {
  return (
    <section className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Measurement & Reporting</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
            <li>Core KPIs: paid sessions, conversion from partner clicks/validations, avg stay, yield by hour/day, repeat rate</li>
            <li>Partner KPIs: redemptions, new vs returning mix, top‑performing offers</li>
            <li>Operator dashboard: tariff edits, offer scheduling, multi‑site comparisons (monthly PDF + live)</li>
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}

export function ComplianceGoodPractice() {
  return (
    <section className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Compliance & Good Practice</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
            <li>Clear signage & terms (Code of Practice alignment)</li>
            <li>Privacy: ANPR/CCTV and app data handled under UK GDPR/DPA; proportionate, transparent use</li>
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}


