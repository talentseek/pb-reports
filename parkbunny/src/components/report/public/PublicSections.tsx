import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { t, type Language } from "@/lib/translations"

type SectionProps = { lang?: Language }

export function ExecutiveAreaSummary({ lang = 'en' }: SectionProps) {
  return (
    <section className="space-y-3">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="w-full h-48 lg:h-56 flex items-center justify-center">
              <Image src="/newsites.png" alt="Local context" width={2000} height={2000} className="w-full h-full object-contain" />
            </div>
            <div className="lg:col-span-2">
              <CardTitle className="text-primary mb-4">{t(lang, 'section.executiveSummary')}</CardTitle>
              <p className="text-sm text-gray-700">{t(lang, 'section.executiveSummary.p1')}</p>
              <p className="text-sm text-gray-700 mt-2">{t(lang, 'section.executiveSummary.p2')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export function AppShowcase({ lang = 'en' }: SectionProps) {
  return (
    <section className="space-y-3">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader>
          <CardTitle className="text-primary">{t(lang, 'section.appShowcase')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2">
              <p className="text-sm text-gray-700">
                {t(lang, 'section.appShowcase.description')}
              </p>
            </div>
            <div className="w-full h-24 lg:h-28 flex items-center justify-center rounded overflow-hidden">
              <Image src="/dashboard.webp" alt="Dashboard mockup" width={3252} height={2096} className="w-full h-full object-contain" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{t(lang, 'section.driverExperience')}</p>
            <div className="rounded-xl overflow-hidden border">
              <Image src="/screens.png" alt="ParkBunny app flow — search, park, earn rewards, redeem offers" width={2400} height={600} className="w-full h-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export function WhatMakesDifferent({ lang = 'en' }: SectionProps) {
  return (
    <section className="space-y-3">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="w-full h-24 lg:h-28 flex items-center justify-center">
              <Image src="/different.webp" alt="Why ParkBunny" width={2000} height={2000} className="w-full h-full object-contain" />
            </div>
            <div className="lg:col-span-2">
              <CardTitle className="text-primary mb-4">{t(lang, 'section.whatMakesDifferent')}</CardTitle>
              <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
                <li>{t(lang, 'section.whatMakesDifferent.b1')}</li>
                <li>{t(lang, 'section.whatMakesDifferent.b2')}</li>
                <li>{t(lang, 'section.whatMakesDifferent.b3')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export function ActivationPlan({ lang = 'en' }: SectionProps) {
  return (
    <section className="space-y-3">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <CardTitle className="text-primary mb-4">{t(lang, 'section.activationPlan')}</CardTitle>
              <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
                <li>{t(lang, 'section.activationPlan.b1')}</li>
                <li>{t(lang, 'section.activationPlan.b2')}</li>
                <li>{t(lang, 'section.activationPlan.b3')}</li>
              </ul>
              <p className="text-xs text-gray-600 mt-2">{t(lang, 'section.activationPlan.metrics')}</p>
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

export function MeasurementReporting({ lang = 'en' }: SectionProps) {
  return (
    <section className="space-y-3">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="w-full h-24 lg:h-28 flex items-center justify-center">
              <Image src="/dashboard.webp" alt="Reporting visuals" width={2000} height={2000} className="w-full h-full object-contain" />
            </div>
            <div className="lg:col-span-2">
              <CardTitle className="text-primary mb-4">{t(lang, 'section.measurement')}</CardTitle>
              <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
                <li>{t(lang, 'section.measurement.b1')}</li>
                <li>{t(lang, 'section.measurement.b2')}</li>
                <li>{t(lang, 'section.measurement.b3')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export function ComplianceGoodPractice({ lang = 'en' }: SectionProps) {
  return (
    <section className="space-y-3">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <CardTitle className="text-primary mb-4">{t(lang, 'section.compliance')}</CardTitle>
              <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
                <li>{t(lang, 'section.compliance.b1')}</li>
                <li>{t(lang, 'section.compliance.b2')}</li>
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
