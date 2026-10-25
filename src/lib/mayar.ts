interface CreateInvoiceParams {
  name: string;
  email: string;
  mobile?: string;
  amount: number;
  description: string;
  redirectUrl?: string;
}

export interface MayarInvoiceDetail {
  id: string;
  status: string;
  isPaid: boolean;
  amount: number | null;
  raw?: any;
}

export function isMayarSandbox(): boolean {
  return process.env.MAYAR_MODE === 'sandbox';
}

export async function createMayarInvoice(params: CreateInvoiceParams) {
  const apiKey = process.env.MAYAR_API_KEY;
  const baseUrl = process.env.MAYAR_BASE_URL || 'https://api.mayar.io/hl/v2';

  const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const siteUrl = process.env.NETLIFY_SITE_URL || 'http://localhost:3000';

  if (!apiKey) {
    console.error('MAYAR_API_KEY tidak dikonfigurasi. Pembuatan invoice dibatalkan.');
    return null;
  }

  try {
    const payload = {
      name: params.name,
      email: params.email,
      mobile: params.mobile || '081234567890',
      amount: params.amount,
      description: params.description,
      items: [
        {
          description: params.description || 'Pendaftaran Kursus',
          quantity: 1,
          rate: params.amount,
        },
      ],
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

  return null;
}

export async function getMayarInvoice(
  invoiceId: string,
  expectedAmount?: number
): Promise<MayarInvoiceDetail | null> {
  const apiKey = process.env.MAYAR_API_KEY;
  const baseUrl = process.env.MAYAR_BASE_URL || 'https://api.mayar.io/hl/v2';

  if (!apiKey) {
    console.warn('MAYAR_API_KEY tidak dikonfigurasi, tidak dapat mengambil invoice dari Mayar.');
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
    if (res.ok && (data?.data || data?.id)) {
      const raw = data.data || data;
      const rawStatus = (raw.status || '').toLowerCase();
      const isPaid =
        raw.isPaid === true ||
        rawStatus === 'paid' ||
        rawStatus === 'closed' ||
        rawStatus === 'settled' ||
        rawStatus === 'success';

      const amountVal =
        raw.amount !== null && raw.amount !== undefined
          ? Number(raw.amount ?? raw.totalAmount ?? raw.paymentAmount)
          : null;

      return {
        id: raw.id || invoiceId,
        status: raw.status || 'unknown',
        isPaid,
        amount: isNaN(Number(amountVal)) ? null : amountVal,
        raw,
      };
    } else {
      console.warn('Mayar invoice lookup response:', data);
      return null;
    }
  } catch (err: any) {
    console.error('Mayar get invoice error:', err.message);
    return null;
  }
}
