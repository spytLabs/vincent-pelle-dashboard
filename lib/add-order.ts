import dotenv from 'dotenv';
dotenv.config();

type AddOrderInput = {
    orderWaybillid: string | number;
    orderNo: string | number;
    receiverName: string;
    receiverStreet: string;
    receiverDistrict: string | number;
    receiverCity: string | number;
    receiverPhone: string;
    description: string;
    spclNote?: string;
    getCod: string | number;
};

async function addOrder(input: AddOrderInput) {
    const apiKey = process.env.KOOMBIYO_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('KOOMBIYO_API_KEY is missing. Check your .env file.');
    }

    const url = `${process.env.KOOMBIYO_BASE_URL}/Addorders/users`;
    const body = new URLSearchParams({
        apikey: apiKey,
        orderWaybillid: String(input.orderWaybillid),
        orderNo: String(input.orderNo),
        receiverName: input.receiverName,
        receiverStreet: input.receiverStreet,
        receiverDistrict: String(input.receiverDistrict),
        receiverCity: String(input.receiverCity),
        receiverPhone: input.receiverPhone,
        description: input.description,
        spclNote: input.spclNote ?? '',
        getCod: String(input.getCod),
    }).toString();

    console.log('Add Order URL:', url);
    console.log('Add Order Body:', body);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        },
        body,
    });

    if (!response.ok) {
        throw new Error(`Failed to add order: ${response.status} ${response.statusText}`);
    }

    const addOrderJson = await response.json();
    console.log('Add Order JSON:', addOrderJson);

    if (addOrderJson?.status === 'error') {
        throw new Error(addOrderJson.message || 'Koombiyo API returned an error while adding order');
    }

    return addOrderJson;
}

export { addOrder };
export type { AddOrderInput };