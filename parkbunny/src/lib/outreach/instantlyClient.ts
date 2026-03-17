/**
 * Instantly API v2 Client
 * Handles campaign creation, lead management, and analytics.
 * Docs: https://developer.instantly.ai/api-reference/introduction
 */

const INSTANTLY_BASE = 'https://api.instantly.ai/api/v2';

function getApiKey(): string {
    const key = process.env.INSTANTLY_API_KEY;
    if (!key) throw new Error('INSTANTLY_API_KEY not set in environment');
    return key;
}

async function instantlyFetch<T>(
    path: string,
    options: { method?: string; body?: unknown } = {},
): Promise<T> {
    const { method = 'GET', body } = options;
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${getApiKey()}`,
    };
    if (body) {
        headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${INSTANTLY_BASE}${path}`, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Instantly API ${method} ${path} failed (${res.status}): ${text}`);
    }

    return res.json();
}

// --- Types ---

export interface InstantlyCampaignSchedule {
    schedules: Array<{
        name: string;
        timing: { from: string; to: string };
        days: Record<string, boolean>; // "0"-"6", 0=sunday
        timezone: string;
    }>;
}

export interface InstantlySequenceStep {
    type: 'email';
    delay: number;
    variants: Array<{ subject: string; body: string }>;
    delay_unit: 'days' | 'hours' | 'minutes';
}

export interface InstantlySequence {
    steps: InstantlySequenceStep[];
}

export interface CreateCampaignPayload {
    name: string;
    campaign_schedule: InstantlyCampaignSchedule;
    sequences: InstantlySequence[];
    email_list: string[];
    text_only: boolean;
    stop_on_reply: boolean;
    daily_limit: number;
    open_tracking: boolean;
    link_tracking: boolean;
}

export interface InstantlyCampaign {
    id: string;
    name: string;
    status: number; // 1 = draft, 0 = active
    timestamp_created: string;
    timestamp_updated: string;
}

export interface CreateLeadPayload {
    campaign: string;
    email: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    phone?: string;
    website?: string;
    personalization?: string;
    custom_variables?: Record<string, unknown>;
    skip_if_in_workspace?: boolean;
    skip_if_in_campaign?: boolean;
}

export interface InstantlyLead {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    company_name: string;
    status: number;
    email_open_count: number;
    email_reply_count: number;
    timestamp_created: string;
}

export interface CampaignAnalytics {
    campaign_id: string;
    leads_count: number;
    sent_count: number;
    open_count: number;
    reply_count: number;
    bounce_count: number;
}

// --- Campaign Operations ---

/**
 * Create a new Instantly campaign with email sequences.
 * Campaign is created in DRAFT status (status=1).
 */
export async function createCampaign(payload: CreateCampaignPayload): Promise<InstantlyCampaign> {
    return instantlyFetch<InstantlyCampaign>('/campaigns', {
        method: 'POST',
        body: payload,
    });
}

/**
 * List all campaigns in the workspace.
 */
export async function listCampaigns(limit = 20): Promise<{ items: InstantlyCampaign[] }> {
    return instantlyFetch<{ items: InstantlyCampaign[] }>(`/campaigns?limit=${limit}`);
}

/**
 * Get a specific campaign by ID.
 */
export async function getCampaign(campaignId: string): Promise<InstantlyCampaign> {
    return instantlyFetch<InstantlyCampaign>(`/campaigns/${campaignId}`);
}

/**
 * Launch (activate) a campaign. Changes status from draft to active.
 */
export async function launchCampaign(campaignId: string): Promise<InstantlyCampaign> {
    return instantlyFetch<InstantlyCampaign>(`/campaigns/${campaignId}/activate`, {
        method: 'POST',
    });
}

/**
 * Pause an active campaign.
 */
export async function pauseCampaign(campaignId: string): Promise<InstantlyCampaign> {
    return instantlyFetch<InstantlyCampaign>(`/campaigns/${campaignId}/deactivate`, {
        method: 'POST',
    });
}

// --- Lead Operations ---

/**
 * Add a single lead to a campaign.
 * Uses skip_if_in_workspace to prevent duplicate sends.
 */
export async function createLead(payload: CreateLeadPayload): Promise<InstantlyLead> {
    return instantlyFetch<InstantlyLead>('/leads', {
        method: 'POST',
        body: {
            ...payload,
            skip_if_in_workspace: payload.skip_if_in_workspace ?? true,
            skip_if_in_campaign: payload.skip_if_in_campaign ?? true,
        },
    });
}

/**
 * Add multiple leads to a campaign, one at a time (respecting API rate limits).
 * Returns results with success/failure per lead.
 */
export async function createLeadsBatch(
    campaignId: string,
    leads: Omit<CreateLeadPayload, 'campaign'>[],
): Promise<{ succeeded: InstantlyLead[]; failed: Array<{ email: string; error: string }> }> {
    const succeeded: InstantlyLead[] = [];
    const failed: Array<{ email: string; error: string }> = [];

    for (const lead of leads) {
        try {
            const result = await createLead({ ...lead, campaign: campaignId });
            succeeded.push(result);
        } catch (err) {
            failed.push({
                email: lead.email,
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return { succeeded, failed };
}

// --- Analytics ---

/**
 * Get campaign analytics summary.
 */
export async function getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    return instantlyFetch<CampaignAnalytics>(`/campaigns/${campaignId}/analytics`);
}

// --- Email Accounts ---

/**
 * List sending email accounts in the workspace.
 * Needed to populate the email_list when creating campaigns.
 */
export async function listEmailAccounts(): Promise<{ items: Array<{ email: string; status: string | number }> }> {
    return instantlyFetch<{ items: Array<{ email: string; status: string | number }> }>('/accounts?limit=50');
}

// --- Default Schedule ---

/**
 * UK business hours schedule, Monday-Friday 9am-5pm GMT.
 */
export function getDefaultSchedule(): InstantlyCampaignSchedule {
    return {
        schedules: [{
            name: 'UK Business Hours',
            timing: { from: '09:00', to: '17:00' },
            days: {
                '0': false, // Sunday
                '1': true,  // Monday
                '2': true,  // Tuesday
                '3': true,  // Wednesday
                '4': true,  // Thursday
                '5': true,  // Friday
                '6': false, // Saturday
            },
            timezone: 'Europe/Isle_of_Man',
        }],
    };
}
