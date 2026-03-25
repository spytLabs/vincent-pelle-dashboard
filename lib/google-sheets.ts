import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export interface Order {
    id: string;
    orderNumber: string;
    status: string;
    dateCreated: string;
    customerName: string;
    email: string;
    phone: string;
    whatsapp: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postcode: string;
    district: string;
    itemsSummary: string;
    shipping: string;
    total: string;
    customerNote: string;
    paymentMethod: string;
}

// Initialize auth
const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

export async function getOrders(): Promise<Order[]> {
    try {
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);

        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0]; // Assuming data is on the first sheet

        // Fetch all rows
        const rows = await sheet.getRows();

        // Filter out rows that are not "processing"
        const filteredRows = rows.filter((row) => {
            const status = row.get('Status');
            return status && status.toString().trim().toLowerCase() === 'processing';
        });

        // Map rows to Order interface based on the requested columns
        return filteredRows.map((row) => ({
            id: row.get('Order ID') || '',
            orderNumber: row.get('Order Number') || '',
            status: row.get('Status') || '',
            dateCreated: row.get('Date Created') || '',
            customerName: row.get('Customer Name') || '',
            email: row.get('Email') || '',
            phone: row.get('Phone') || '',
            whatsapp: row.get('WhatsApp') || '',
            addressLine1: row.get('Address Line 1') || '',
            addressLine2: row.get('Address Line 2') || '',
            city: row.get('City') || '',
            state: row.get('State') || '',
            postcode: row.get('Postcode') || '',
            district: row.get('District') || '',
            itemsSummary: row.get('Items Summary') || '',
            shipping: row.get('Shipping') || '',
            total: row.get('Total') || '',
            customerNote: row.get('Customer Note') || '',
            paymentMethod: row.get('Payment Method') || '',
        }));
    } catch (error) {
        console.error("Error fetching orders from Google Sheets:", error);
        return [];
    }
}
