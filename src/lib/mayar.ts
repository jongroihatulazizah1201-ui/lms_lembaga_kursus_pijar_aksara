interface CreateInvoiceParams {
  name: string;
  email: string;
  mobile?: string;
  amount: number;
  description: string;
  redirectUrl?: string;
}

export async function createMayarInvoice(params: CreateInvoiceParams) {
  const apiKey = process.env.MAYAR_API_KEY;
  const baseUrl = process.env.MAYAR_BASE_URL || 'https://api.mayar.io/hl/v2';

  if (!apiKey) {
    console.warn('MAYAR_API_KEY not configured, skipping payment gateway creation.');
    return null;
  }

  try {
    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const payload = {
      name: params.name,
      email: params.email,
      mobile: params.mobile || '081234567890',
      amount: params.amount,
      description: params.description,
      expiredAt: expiredAt,
      redirectUrl: params.redirectUrl || `${process.env.NETLIFY_SITE_URL || 'http://localhost:3000'}/kursus-saya`,
    };

    const res = await fetch(`${baseUrl}/invoices/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data?.data) {
      return {
        id: data.data.id,
        link: data.data.link || data.data.url || data.data.paymentUrl,
        raw: data.data,
      };
    } else {
      console.warn('Mayar invoice response error:', data);
      return null;
    }
  } catch (err: any) {
    console.error('Mayar invoice error:', err.message);
    return null;
  }
}
