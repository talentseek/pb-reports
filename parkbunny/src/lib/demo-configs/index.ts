import type { DemoConfig } from './types'
import ecpParkbuddy from './ecp-parkbuddy.json'

const configs: Record<string, DemoConfig> = {
    'ecp-parkbuddy': ecpParkbuddy as unknown as DemoConfig,
}

export function getDemoConfig(slug: string): DemoConfig | null {
    return configs[slug] ?? null
}

export function getAllDemoSlugs(): string[] {
    return Object.keys(configs)
}
