/**
 * Email Verification Service (Reoon)
 * 
 * Verifies email addresses via the Reoon API.
 * Uses "power" mode for thorough verification.
 * 
 * API: GET https://emailverifier.reoon.com/api/v1/verify?email=X&key=X&mode=power
 * Docs: https://emailverifier.reoon.com/api
 */

const REOON_API_KEY = process.env.REOON_API_KEY || '';
const REOON_BASE_URL = 'https://emailverifier.reoon.com/api/v1';

export type VerificationResult = {
    email: string;
    status: 'valid' | 'invalid' | 'catch_all' | 'unknown' | 'disposable' | 'role_account';
    isDeliverable: boolean;
    isSafeToSend: boolean;
    overallScore: number;
    isCatchAll: boolean;
    isRoleAccount: boolean;
    provider: string | null;
    error?: string;
};

/**
 * Verify a single email address using Reoon Power mode.
 * Power mode checks everything including SMTP inbox verification.
 * Can take up to 60s for slow mail servers.
 */
export async function verifyEmail(email: string): Promise<VerificationResult> {
    if (!REOON_API_KEY) {
        return emptyResult(email, 'Reoon API key not configured');
    }

    try {
        // Reoon uses GET requests with query params
        const url = `${REOON_BASE_URL}/verify?email=${encodeURIComponent(email)}&key=${encodeURIComponent(REOON_API_KEY)}&mode=power`;

        const response = await fetch(url, {
            method: 'GET',
            signal: AbortSignal.timeout(65000), // Power mode can take up to 60s
        });

        if (!response.ok) {
            return emptyResult(email, `Reoon HTTP ${response.status}`);
        }

        const data = await response.json();

        return {
            email,
            status: mapReoonStatus(data.status),
            isDeliverable: data.is_deliverable === true,
            isSafeToSend: data.is_safe_to_send === true,
            overallScore: data.overall_score || 0,
            isCatchAll: data.is_catch_all === true,
            isRoleAccount: data.is_role_account === true,
            provider: data.domain || null,
        };
    } catch (err: any) {
        return emptyResult(email, err.message);
    }
}

/**
 * Verify multiple emails (batch).
 * Processes sequentially with small delays to respect rate limits.
 */
export async function verifyEmails(emails: string[]): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];

    for (const email of emails) {
        const result = await verifyEmail(email);
        results.push(result);
        await delay(500); // Slightly longer delay for power mode
    }

    return results;
}

/**
 * Verify an email and determine if it's worth sending to.
 * Returns true for valid/safe and catch-all (many small business domains are catch-all).
 */
export async function isEmailUsable(email: string): Promise<boolean> {
    const result = await verifyEmail(email);
    return result.isDeliverable || result.isCatchAll;
}

function emptyResult(email: string, error: string): VerificationResult {
    return {
        email,
        status: 'unknown',
        isDeliverable: false,
        isSafeToSend: false,
        overallScore: 0,
        isCatchAll: false,
        isRoleAccount: false,
        provider: null,
        error,
    };
}

function mapReoonStatus(status: string): VerificationResult['status'] {
    switch (status?.toLowerCase()) {
        case 'valid':
        case 'safe':
            return 'valid';
        case 'invalid':
        case 'disabled':
            return 'invalid';
        case 'catch_all':
            return 'catch_all';
        case 'disposable':
            return 'disposable';
        case 'role_account':
            return 'role_account';
        case 'inbox_full':
        case 'spamtrap':
            return 'invalid';
        default:
            return 'unknown';
    }
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
