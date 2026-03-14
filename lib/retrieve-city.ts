import dotenv from 'dotenv';
dotenv.config();

async function retrieveCity(city: string, districtId: string | number) {
    const apiKey = process.env.KOOMBIYO_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('KOOMBIYO_API_KEY is missing. Check your .env file.');
    }

    const url = `${process.env.KOOMBIYO_BASE_URL}/Cities/users`;
    const body = new URLSearchParams({
        apikey: apiKey,
        district_id: String(districtId),
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
        throw new Error(`Failed to fetch cities: ${response.status} ${response.statusText}`);
    }

    const citiesJson = await response.json();
    console.log('Cities JSON:', citiesJson);

    if (citiesJson?.status === 'error') {
        throw new Error(citiesJson.message || 'Koombiyo API returned an error');
    }

    const cities = Array.isArray(citiesJson) ? citiesJson : (citiesJson?.cities || []);
    const match = cities.find(
        (c: any) =>
            c.city_name?.toLowerCase() === city.toLowerCase() ||
            c.name?.toLowerCase() === city.toLowerCase()
    );

    return match?.city_id ?? null;
}

export { retrieveCity };