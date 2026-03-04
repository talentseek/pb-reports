import type { DemoConfig } from './types'
import ecpParkbuddy from './ecp-parkbuddy.json'
import intelliPark from './intelli-park.json'

const configs: Record<string, DemoConfig> = {
    'ecp-parkbuddy': ecpParkbuddy as unknown as DemoConfig,
    'intelli-park': intelliPark as unknown as DemoConfig,
}

export function getDemoConfig(slug: string): DemoConfig | null {
    return configs[slug] ?? null
}

export function getAllDemoSlugs(): string[] {
    return Object.keys(configs)
}
