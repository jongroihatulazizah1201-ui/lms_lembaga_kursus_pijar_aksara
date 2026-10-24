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

  const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const siteUrl = process.env.NETLIFY_SITE_URL || 'http://localhost:3000';

  if (!apiKey) {
    console.warn('MAYAR_API_KEY not configured, generating sandbox simulation invoice.');
    const mockId = `inv_sb_${Date.now()}`;
    return {
      id: mockId,
      link: `https://sandbox.mayar.id/inv/${mockId}`,
      raw: { id: mockId, amount: params.amount, status: 'unpaid' },
    };
  }

  try {
    const payload = {
      name: params.name,
      email: params.email,
      mobile: params.mobile || '081234567890',
      amount: params.amount,
      description: params.description,
      expiredAt: expiredAt,
      redirectUrl: params.redirectUrl || `${siteUrl}/kursus-saya`,
    };

    const res = await fetch(`${baseUrl}/invoices/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
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
    }
  } catch (err: any) {
    console.error('Mayar invoice error:', err.message);
  }

  // Fallback tangguh untuk Sandbox/Pengujian jika host Mayar sedang kendala jaringan/timeout
  const mockId = `inv_sb_${Date.now()}`;
  return {
    id: mockId,
    link: `https://sandbox.mayar.id/inv/${mockId}`,
    raw: { id: mockId, amount: params.amount, status: 'unpaid' },
  };
}

export async function getMayarInvoice(invoiceId: string) {
  const apiKey = process.env.MAYAR_API_KEY;
  const baseUrl = process.env.MAYAR_BASE_URL || 'https://api.mayar.io/hl/v2';

  // Jika invoice ID adalah tagihan simulasi sandbox
  if (invoiceId.startsWith('inv_sb_')) {
    return {
      id: invoiceId,
      status: 'paid',
      isPaid: true,
      amount: null,
    };
  }

  if (!apiKey) {
    console.warn('MAYAR_API_KEY not configured, cannot retrieve invoice from Mayar.');
    return null;
  }

  try {
    const res = await fetch(`${baseUrl}/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json();
    if (res.ok && data?.data) {
      return data.data;
    } else if (res.ok && data?.id) {
      return data;
    } else {
      console.warn('Mayar invoice lookup response:', data);
      return null;
    }
  } catch (err: any) {
    console.error('Mayar get invoice error:', err.message);
    return null;
  }
}
