const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || "ck_1371e5c9b0de10a511ac10cd893e9dfe48526317";
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || "cs_10332462d1ad7716d6327dd8f3064018160fca6b";
const WC_API_URL = "https://vinzvault.lk/wp-json/wc/v3";

export async function syncOrderToWooCommerce(orderId: string, updates: Record<string, string>) {
    const wcUpdates: any = {};

    if (updates["City"]) {
        wcUpdates.billing = { ...wcUpdates.billing, city: updates["City"] };
        wcUpdates.shipping = { ...wcUpdates.shipping, city: updates["City"] };
    }

    if (updates["District"]) {
        wcUpdates.meta_data = [
            { key: "district", value: updates["District"] }
        ];
    }

    if (Object.keys(wcUpdates).length === 0) return;

    const auth = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");

    const res = await fetch(`${WC_API_URL}/orders/${orderId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`
        },
        body: JSON.stringify(wcUpdates)
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error(`Failed to sync to WooCommerce for order ${orderId}:`, errorText);
        throw new Error(`WooCommerce sync failed: ${res.statusText}`);
    }

    return await res.json();
}
