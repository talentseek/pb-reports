import type { AppDemo } from '@prisma/client'
import type { DemoConfig } from './demo-configs/types'

/**
 * Transform a Prisma AppDemo row into the DemoConfig shape
 * used by all downstream components (ClientDemo, LandingScreen, DemoNav, etc.)
 */
export function transformToConfig(demo: AppDemo): DemoConfig {
    return {
        slug: demo.slug,
        password: demo.password || undefined,
        operator: {
            name: demo.operatorName,
            tagline: demo.operatorTagline,
            logo: demo.operatorLogo,
            logoAlt: demo.operatorLogoAlt || undefined,
            brandStrip: demo.brandStripLogo
                ? {
                    logo: demo.brandStripLogo,
                    alt: demo.brandStripAlt || '',
                    background: demo.brandStripBackground || '#000',
                }
                : undefined,
            colors: {
                primary: demo.colorPrimary,
                secondary: demo.colorSecondary,
                accent: demo.colorAccent,
                background: demo.colorBackground,
                text: demo.colorText,
                cardBg: demo.colorCardBg,
                cta: demo.colorCta,
            },
            font: demo.operatorFont,
        },
        location: {
            name: demo.locationName,
            address: demo.locationAddress,
            postcode: demo.locationPostcode,
            phone: demo.locationPhone,
            locationCode: demo.locationCode,
            city: demo.locationCity,
            totalSpaces: demo.totalSpaces,
            hourlyRate: demo.hourlyRate,
            lat: demo.lat || undefined,
            lng: demo.lng || undefined,
        },
        deals: (demo.deals as any) || [],
        partnerView: (demo.partnerView as any) || {},
    }
}
