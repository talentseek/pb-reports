import { PrismaClient } from '@prisma/client'
import ecpConfig from '../src/lib/demo-configs/ecp-parkbuddy.json'
import intelliParkConfig from '../src/lib/demo-configs/intelli-park.json'

const prisma = new PrismaClient()

async function seedDemos() {
    console.log('Seeding app demos...')

    // ECP ParkBuddy
    await prisma.appDemo.upsert({
        where: { slug: 'ecp-parkbuddy' },
        update: {},
        create: {
            slug: ecpConfig.slug,
            password: ecpConfig.password,
            operatorName: ecpConfig.operator.name,
            operatorTagline: ecpConfig.operator.tagline,
            operatorLogo: ecpConfig.operator.logo,
            operatorLogoAlt: ecpConfig.operator.logoAlt || null,
            operatorFont: ecpConfig.operator.font,
            brandStripLogo: ecpConfig.operator.brandStrip?.logo || null,
            brandStripAlt: ecpConfig.operator.brandStrip?.alt || null,
            brandStripBackground: ecpConfig.operator.brandStrip?.background || null,
            colorPrimary: ecpConfig.operator.colors.primary,
            colorSecondary: ecpConfig.operator.colors.secondary,
            colorAccent: ecpConfig.operator.colors.accent,
            colorBackground: ecpConfig.operator.colors.background,
            colorText: ecpConfig.operator.colors.text,
            colorCardBg: ecpConfig.operator.colors.cardBg,
            colorCta: ecpConfig.operator.colors.cta,
            locationName: ecpConfig.location.name,
            locationAddress: ecpConfig.location.address,
            locationPostcode: ecpConfig.location.postcode,
            locationPhone: ecpConfig.location.phone,
            locationCode: ecpConfig.location.locationCode,
            locationCity: ecpConfig.location.city,
            totalSpaces: ecpConfig.location.totalSpaces,
            hourlyRate: ecpConfig.location.hourlyRate,
            lat: ecpConfig.location.lat || null,
            lng: ecpConfig.location.lng || null,
            deals: ecpConfig.deals as any,
            partnerView: ecpConfig.partnerView as any,
        },
    })
    console.log('  ✓ ECP ParkBuddy')

    // Intelli-Park
    await prisma.appDemo.upsert({
        where: { slug: 'intelli-park' },
        update: {},
        create: {
            slug: intelliParkConfig.slug,
            password: intelliParkConfig.password,
            operatorName: intelliParkConfig.operator.name,
            operatorTagline: intelliParkConfig.operator.tagline,
            operatorLogo: intelliParkConfig.operator.logo,
            operatorLogoAlt: null,
            operatorFont: intelliParkConfig.operator.font,
            brandStripLogo: null,
            brandStripAlt: null,
            brandStripBackground: null,
            colorPrimary: intelliParkConfig.operator.colors.primary,
            colorSecondary: intelliParkConfig.operator.colors.secondary,
            colorAccent: intelliParkConfig.operator.colors.accent,
            colorBackground: intelliParkConfig.operator.colors.background,
            colorText: intelliParkConfig.operator.colors.text,
            colorCardBg: intelliParkConfig.operator.colors.cardBg,
            colorCta: intelliParkConfig.operator.colors.cta,
            locationName: intelliParkConfig.location.name,
            locationAddress: intelliParkConfig.location.address,
            locationPostcode: intelliParkConfig.location.postcode,
            locationPhone: intelliParkConfig.location.phone,
            locationCode: intelliParkConfig.location.locationCode,
            locationCity: intelliParkConfig.location.city,
            totalSpaces: intelliParkConfig.location.totalSpaces,
            hourlyRate: intelliParkConfig.location.hourlyRate,
            lat: intelliParkConfig.location.lat || null,
            lng: intelliParkConfig.location.lng || null,
            deals: intelliParkConfig.deals as any,
            partnerView: intelliParkConfig.partnerView as any,
        },
    })
    console.log('  ✓ Intelli-Park')

    console.log('Done!')
}

seedDemos()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
