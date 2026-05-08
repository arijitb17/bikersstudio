// lib/delhivery.ts

const BASE_URL = process.env.DELHIVERY_BASE_URL!;
const TOKEN = process.env.DELHIVERY_TOKEN!;

const authHeaders = {
  Authorization: `Token ${TOKEN}`,
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
const waybillRes = await fetch(
  `${BASE_URL}/waybill/api/bulk/json/?count=1`,
  { headers: authHeaders },
);
  if (!waybillRes.ok) {
    const errText = await waybillRes.text();
    throw new Error(`Failed to generate Delhivery waybill: ${waybillRes.status} ${errText}`);
  }

const waybillData = await waybillRes.json();

const awb =
  typeof waybillData === 'string'
    ? waybillData
    : waybillData?.wbn_list?.[0];

if (!awb) throw new Error('No waybill returned from Delhivery');

  // Step 2: create the shipment using that waybill
  const shipmentData = {
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
        products_desc: payload.items.map((i) => i.name).join(', '),
        hsn_code: '',
        cod_amount: payload.paymentMethod === 'COD' ? payload.totalAmount.toString() : '0',
        order_date: new Date().toISOString().split('T')[0],
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
      name: process.env.DELHIVERY_PICKUP_LOCATION_NAME!,
    },
  };

  const formBody = new URLSearchParams({
    format: 'json',
    data: JSON.stringify(shipmentData),
  }).toString();

  const createRes = await fetch(`${BASE_URL}/api/cmu/create.json`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Delhivery shipment creation failed (${createRes.status}): ${err}`);
  }

  const createData = await createRes.json();

  // Validate response shape before trusting it
  if (!createData || typeof createData !== 'object') {
    throw new Error('Delhivery returned an unexpected response shape');
  }
  if (createData.error || createData.success === false) {
  throw new Error(`Delhivery error: ${JSON.stringify(createData)}`);
}

  return {
    awb,
    trackingUrl: `https://www.delhivery.com/track/package/${awb}`,
  };
}

export async function trackDelhiveryShipment(awb: string) {
  const res = await fetch(`${BASE_URL}/api/v1/packages/json/?waybill=${encodeURIComponent(awb)}`, {
    headers: authHeaders,
  });
  if (!res.ok) throw new Error(`Failed to fetch tracking info: ${res.status}`);
  return res.json();
}