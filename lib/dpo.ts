/**
 * DPO Pay by Network (Direct Pay Online) — API v6 client.
 * Server-side only. Never import in client components.
 *
 * Env vars required:
 *   DPO_COMPANY_TOKEN    — Your merchant token from DPO
 *   DPO_SERVICE_TYPE     — Service type code assigned during onboarding (e.g. "3854")
 *   DPO_PAYMENT_CURRENCY — Default ISO currency code (e.g. "USD", "KES", "ZAR")
 */

const DPO_API_URL =
  process.env.DPO_SANDBOX === 'true'
    ? 'https://secure1.sandbox.directpay.online/API/v6/'
    : 'https://secure.3gdirectpay.com/API/v6/';

/** Redirect the customer to DPO's hosted checkout page. */
export const dpoBuildCheckoutUrl = (transToken: string) =>
  `https://secure.3gdirectpay.com/pay.asp?ID=${transToken}`;

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

/** Extract the text value of a single XML tag (first occurrence). */
function xmlTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`));
  return m ? m[1].trim() : '';
}

/** Escape characters that are special in XML. */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ---------------------------------------------------------------------------
// createToken
// ---------------------------------------------------------------------------

export interface DpoCreateTokenParams {
  companyToken: string;
  serviceType: string;
  /** Formatted as "0.00" */
  amount: string;
  /** ISO currency code, e.g. "USD" */
  currency: string;
  /** Your unique order reference (use the DB order UUID). */
  companyRef: string;
  /** Full HTTPS URL the customer is redirected to after payment. */
  redirectUrl: string;
  /** Full HTTPS URL for server-to-server callback. */
  backUrl: string;
  /** Payment token validity in hours (default 5). */
  ptl?: number;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  description?: string;
}

export interface DpoCreateTokenResult {
  transToken: string;
  transRef: string;
}

export async function dpoCreateToken(
  params: DpoCreateTokenParams,
): Promise<DpoCreateTokenResult> {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const serviceDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const optionalCustomer = [
    params.customerFirstName
      ? `<customerFirstName>${xmlEscape(params.customerFirstName)}</customerFirstName>`
      : '',
    params.customerLastName
      ? `<customerLastName>${xmlEscape(params.customerLastName)}</customerLastName>`
      : '',
    params.customerEmail
      ? `<customerEmail>${xmlEscape(params.customerEmail)}</customerEmail>`
      : '',
  ]
    .filter(Boolean)
    .join('\n    ');

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${xmlEscape(params.companyToken)}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${xmlEscape(params.amount)}</PaymentAmount>
    <PaymentCurrency>${xmlEscape(params.currency)}</PaymentCurrency>
    <CompanyRef>${xmlEscape(params.companyRef)}</CompanyRef>
    <RedirectURL>${xmlEscape(params.redirectUrl)}</RedirectURL>
    <BackURL>${xmlEscape(params.backUrl)}</BackURL>
    <CompanyRefUnique>0</CompanyRefUnique>
    <PTL>${params.ptl ?? 5}</PTL>
    ${optionalCustomer}
  </Transaction>
  <Services>
    <Service>
      <ServiceType>${xmlEscape(params.serviceType)}</ServiceType>
      <ServiceDescription>${xmlEscape(params.description ?? 'SouthCaravan marketplace order')}</ServiceDescription>
      <ServiceDate>${serviceDate}</ServiceDate>
    </Service>
  </Services>
</API3G>`;

  const res = await fetch(DPO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      Accept: 'application/xml',
    },
    body: xml,
  });

  if (!res.ok) {
    throw new Error(`DPO API HTTP ${res.status}`);
  }

  const body = await res.text();
  const result = xmlTag(body, 'Result');

  if (result !== '000') {
    const explanation = xmlTag(body, 'ResultExplanation');
    throw new Error(`DPO createToken error ${result}: ${explanation}`);
  }

  return {
    transToken: xmlTag(body, 'TransToken'),
    transRef: xmlTag(body, 'TransRef'),
  };
}

// ---------------------------------------------------------------------------
// verifyToken
// ---------------------------------------------------------------------------

export interface DpoVerifyTokenResult {
  /** "000" = paid, "900" = not paid yet, "901" = declined, etc. */
  result: string;
  resultExplanation: string;
  customerName?: string;
  transactionAmount?: string;
  transactionCurrency?: string;
  fraudAlert?: string;
}

export async function dpoVerifyToken(
  companyToken: string,
  transactionToken: string,
): Promise<DpoVerifyTokenResult> {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${xmlEscape(companyToken)}</CompanyToken>
  <Request>verifyToken</Request>
  <TransactionToken>${xmlEscape(transactionToken)}</TransactionToken>
</API3G>`;

  const res = await fetch(DPO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      Accept: 'application/xml',
    },
    body: xml,
  });

  if (!res.ok) {
    throw new Error(`DPO API HTTP ${res.status}`);
  }

  const body = await res.text();

  return {
    result: xmlTag(body, 'Result'),
    resultExplanation: xmlTag(body, 'ResultExplanation'),
    customerName: xmlTag(body, 'CustomerName') || undefined,
    transactionAmount: xmlTag(body, 'TransactionAmount') || undefined,
    transactionCurrency: xmlTag(body, 'TransactionCurrency') || undefined,
    fraudAlert: xmlTag(body, 'FraudAlert') || undefined,
  };
}

// ---------------------------------------------------------------------------
// Env helpers (throw-early pattern for server routes)
// ---------------------------------------------------------------------------

export function getDpoConfig(): {
  companyToken: string;
  serviceType: string;
  currency: string;
} {
  const companyToken = process.env.DPO_COMPANY_TOKEN;
  const serviceType = process.env.DPO_SERVICE_TYPE;
  const currency = process.env.DPO_PAYMENT_CURRENCY ?? 'USD';

  if (!companyToken) throw new Error('DPO_COMPANY_TOKEN env var is not set');
  if (!serviceType) throw new Error('DPO_SERVICE_TYPE env var is not set');

  return { companyToken, serviceType, currency };
}
