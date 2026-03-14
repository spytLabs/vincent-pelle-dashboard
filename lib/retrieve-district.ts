import dotenv from 'dotenv';
dotenv.config();

async function retrieveDistrict(district: string) {
    const apiKey = process.env.KOOMBIYO_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('KOOMBIYO_API_KEY is missing. Check your .env file.');
    }

    const url = `${process.env.KOOMBIYO_BASE_URL}/Districts/users`;
    const body = new URLSearchParams({
        apikey: apiKey,
    }).toString();

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        },
        body,
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch districts: ${response.status} ${response.statusText}`);
    }

    const districtsJson = await response.json();
    console.log('Districts JSON:', districtsJson);

    if (districtsJson?.status === 'error') {
        throw new Error(districtsJson.message || 'Koombiyo API returned an error');
    }

    const districts = Array.isArray(districtsJson) ? districtsJson : (districtsJson?.districts || []);
    const match = districts.find(
        (d: any) => d.district_name?.toLowerCase() === district.toLowerCase()
    );

    return match?.district_id ?? null;
}

export { retrieveDistrict };

