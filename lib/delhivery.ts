// lib/delhivery.ts

const BASE_URL = process.env.DELHIVERY_BASE_URL!; // https://track.delhivery.com for prod, https://staging-express.delhivery.com for sandbox
const TOKEN = process.env.DELHIVERY_TOKEN!;

const headers = {
  Authorization: `Token ${TOKEN}`,
  'Content-Type': 'application/json',
};

export interface DelhiveryShipmentPayload {
  orderNumber: string;
  totalAmount: number;
  paymentMethod: 'Prepaid' | 'COD';
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  weight?: number; // in kg, default 0.5
}

export async function createDelhiveryShipment(payload: DelhiveryShipmentPayload): Promise<{
  awb: string;
  trackingUrl: string;
}> {
  // Step 1: get a waybill
  const waybillRes = await fetch(`${BASE_URL}/api/backend/generate/wbn/?count=1&cl=Mumbai`, {
    headers,
  });
  if (!waybillRes.ok) throw new Error('Failed to generate Delhivery waybill');
  const waybillData = await waybillRes.json();
  const awb: string = waybillData.wbn_list?.[0];
  if (!awb) throw new Error('No waybill returned from Delhivery');

  // Step 2: create the shipment using that waybill
  const shipmentPayload = {
    format: 'json',
    data: JSON.stringify({
      shipments: [
        {
          name: payload.customer.name,
          add: payload.address.street,
          city: payload.address.city,
          state: payload.address.state,
          country: payload.address.country,
          pin: payload.address.pincode,
          phone: payload.customer.phone,
          order: payload.orderNumber,
          payment_mode: payload.paymentMethod,
          return_pin: process.env.DELHIVERY_RETURN_PINCODE!,
          return_city: process.env.DELHIVERY_RETURN_CITY!,
          return_phone: process.env.DELHIVERY_RETURN_PHONE!,
          return_name: "Biker's Studio",
          return_add: process.env.DELHIVERY_RETURN_ADDRESS!,
          return_state: process.env.DELHIVERY_RETURN_STATE!,
          return_country: 'India',
          products_desc: payload.items.map(i => i.name).join(', '),
          hsn_code: '',
          cod_amount: payload.paymentMethod === 'COD' ? payload.totalAmount.toString() : '0',
          order_date: new Date().toISOString(),
          total_amount: payload.totalAmount.toString(),
          seller_add: process.env.DELHIVERY_RETURN_ADDRESS!,
          seller_name: "Biker's Studio",
          seller_inv: payload.orderNumber,
          quantity: payload.items.reduce((s, i) => s + i.quantity, 0).toString(),
          weight: ((payload.weight ?? 0.5) * 1000).toString(), // grams
          shipment_width: '15',
          shipment_height: '10',
          shipment_length: '20',
          comments: '',
          waybill: awb,
          taxable_amount: payload.totalAmount.toString(),
          gst_amount: '',
          gst_tax_percentage: '',
          src_city: process.env.DELHIVERY_RETURN_CITY!,
        },
      ],
      pickup_location: {
        name: process.env.DELHIVERY_PICKUP_LOCATION_NAME!, // name of registered pickup location in Delhivery dashboard
      },
    }),
  };

  const formBody = new URLSearchParams(shipmentPayload as Record<string, string>).toString();

  const createRes = await fetch(`${BASE_URL}/api/backend/clientshipment/create/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${TOKEN}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Delhivery shipment creation failed: ${err}`);
  }

  const createData = await createRes.json();
  if (!createData.success) {
    throw new Error(`Delhivery error: ${JSON.stringify(createData)}`);
  }

  return {
    awb,
    trackingUrl: `https://www.delhivery.com/track/package/${awb}`,
  };
}

export async function trackDelhiveryShipment(awb: string) {
  const res = await fetch(`${BASE_URL}/api/v1/packages/json/?waybill=${awb}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch tracking info');
  return res.json();
}