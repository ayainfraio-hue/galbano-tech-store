import { createSign } from "node:crypto";

type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
};

type SheetCell = string | number | boolean | null;
type SheetValue = SheetCell | Record<string, unknown> | unknown[];

let cachedToken: { value: string; expiresAt: number } | undefined;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Google Sheets: variável ${name} não configurada`);
  return value;
}

function getServiceAccount(): GoogleServiceAccount {
  const client_email = requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const private_key = requiredEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");
  if (!private_key.includes("-----BEGIN PRIVATE KEY-----") ||
      !private_key.includes("-----END PRIVATE KEY-----")) {
    throw new Error("Google Sheets: GOOGLE_PRIVATE_KEY não contém uma chave PEM válida");
  }
  return { client_email, private_key };
}

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const account = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${signer.sign(account.private_key).toString("base64url")}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const payload = await response.json() as { access_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(`Google authentication failed: ${payload.error ?? response.statusText}`);
  }
  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

async function sheetsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${requiredEnv("GOOGLE_SHEET_ID")}${path}`,
    {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        ...init?.headers,
      },
    },
  );
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Google Sheets API error (${response.status}): ${body.slice(0, 500)}`);
  }
  return (body ? JSON.parse(body) : {}) as T;
}

function quoteTab(tab: string): string {
  if (!/^[a-zA-Z0-9_ -]+$/.test(tab)) throw new Error("Nome de aba inválido");
  return `'${tab.replace(/'/g, "''")}'`;
}

function toSheetCell(value: SheetValue): SheetCell {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return JSON.stringify(value);
}

export type SheetRow = Record<string, SheetValue>;

type SpreadsheetMetadata = { sheets?: { properties?: { sheetId?: number; title?: string } }[] };

/** Creates a missing tab and its header, but never clears or overwrites existing content. */
export async function ensureSheetTab(tab: string, headers: string[]): Promise<void> {
  if (!headers.length || headers.some((header) => !header.trim())) {
    throw new Error(`A aba ${tab} precisa ter cabeçalhos válidos`);
  }
  const metadata = await sheetsRequest<SpreadsheetMetadata>("?fields=sheets.properties(sheetId,title)");
  let sheet = metadata.sheets?.find((item) => item.properties?.title === tab);
  if (!sheet) {
    await sheetsRequest(":batchUpdate", {
      method: "POST",
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tab } } }] }),
    });
    sheet = { properties: { title: tab } };
  }

  const range = encodeURIComponent(`${quoteTab(tab)}!A:ZZ`);
  const current = await sheetsRequest<{ values?: SheetCell[][] }>(`/values/${range}`);
  const existingHeaders = current.values?.[0]?.map(String) ?? [];
  if (!existingHeaders.length) {
    await sheetsRequest(`/values/${encodeURIComponent(`${quoteTab(tab)}!A1`)}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: [headers] }),
    });
    return;
  }
  if (existingHeaders.length !== headers.length || existingHeaders.some((value, index) => value !== headers[index])) {
    throw new Error(`A aba "${tab}" já existe com cabeçalhos diferentes. Nenhum dado foi alterado.`);
  }
}

/** Reads a tab using its first row as column names. */
export async function readSheetRows(tab: string): Promise<SheetRow[]> {
  const range = encodeURIComponent(`${quoteTab(tab)}!A:ZZ`);
  const result = await sheetsRequest<{ values?: SheetCell[][] }>(`/values/${range}`);
  const [headers = [], ...rows] = result.values ?? [];
  return rows
    .filter((row) => row.some((value) => value !== "" && value !== null))
    .map((row) => Object.fromEntries(headers.map((header, index) => [String(header), row[index] ?? ""])));
}

/** Appends rows in the exact header order of the destination tab. */
export async function appendSheetRows(tab: string, rows: SheetRow[]): Promise<void> {
  if (!rows.length) return;
  const range = encodeURIComponent(`${quoteTab(tab)}!A:ZZ`);
  const current = await sheetsRequest<{ values?: SheetCell[][] }>(`/values/${range}`);
  const headers = current.values?.[0]?.map(String) ?? [];
  if (!headers.length) throw new Error(`A aba ${tab} não possui cabeçalho`);
  const values = rows.map((row) => headers.map((header) => toSheetCell(row[header] ?? null)));
  await sheetsRequest(`/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values }),
  });
}

/** Updates a complete row, preserving the tab's declared column order. */
export async function updateSheetRow(tab: string, rowNumber: number, row: SheetRow): Promise<void> {
  if (!Number.isInteger(rowNumber) || rowNumber < 2) throw new Error("Número de linha inválido");
  const range = encodeURIComponent(`${quoteTab(tab)}!A${rowNumber}:ZZ${rowNumber}`);
  const current = await sheetsRequest<{ values?: SheetCell[][] }>(`/values/${encodeURIComponent(`${quoteTab(tab)}!A:ZZ`)}`);
  const headers = current.values?.[0]?.map(String) ?? [];
  if (!headers.length) throw new Error(`A aba ${tab} não possui cabeçalho`);
  await sheetsRequest(`/values/${range}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: [headers.map((header) => toSheetCell(row[header] ?? null))] }),
  });
}
