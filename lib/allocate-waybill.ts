import dotenv from 'dotenv';
dotenv.config();

async function allocateWaybill() {
    const apiKey = process.env.KOOMBIYO_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('KOOMBIYO_API_KEY is missing. Check your .env file.');
    }

    const url = `${process.env.KOOMBIYO_BASE_URL}/Waybils/users`;
    const body = new URLSearchParams({
        apikey: apiKey,
        limit: '1',
    }).toString();

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            apikey: apiKey,
        },
        body,
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch waybills: ${response.status} ${response.statusText}`);
    }

    const waybillsJson = await response.json();

    if (waybillsJson?.status === 'error') {
        throw new Error(waybillsJson.message || 'Koombiyo API returned an error');
    }

    const waybills = Array.isArray(waybillsJson) ? waybillsJson : (waybillsJson?.waybills || []);
    const first = waybills[0];

    if (!first) {
        return null;
    }

    return first.waybill_id;
}

export { allocateWaybill };