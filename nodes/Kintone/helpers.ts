import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import type { ICredentialDataDecryptedObject, IDataObject } from 'n8n-workflow';

export type KintoneCredentialData = {
  baseUrl: string;
  apiTokens: string[];
};

export function parseCredentials(credentials: ICredentialDataDecryptedObject): KintoneCredentialData {
  const baseUrl = String(credentials.baseUrl ?? '').trim().replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('Base URLを指定してください。 / Specify a Base URL.');
  }

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error('Base URLが有効なURLではありません。 / Base URL must be a valid URL.');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Base URLはHTTPSで指定してください。 / Base URL must use HTTPS.');
  }
  if (parsed.pathname !== '/' && parsed.pathname !== '') {
    throw new Error(
      'Base URLにパスを含めないでください。 / Do not include a path in Base URL.',
    );
  }

  const apiTokens = String(credentials.apiTokens ?? '')
    .split(/[\n,]/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (apiTokens.length < 1 || apiTokens.length > 9) {
    throw new Error(
      'APIトークンは1〜9個指定してください。 / Specify between 1 and 9 API tokens.',
    );
  }
  if (new Set(apiTokens).size !== apiTokens.length) {
    throw new Error(
      '同じAPIトークンを複数回指定することはできません。 / The same API token cannot be specified more than once.',
    );
  }

  return { baseUrl, apiTokens };
}

export function createKintoneClient(
  credentials: KintoneCredentialData,
  guestSpaceId?: string,
): KintoneRestAPIClient {
  return new KintoneRestAPIClient({
    baseUrl: credentials.baseUrl,
    auth: { apiToken: credentials.apiTokens },
    ...(guestSpaceId ? { guestSpaceId } : {}),
  });
}

export function positiveInteger(value: unknown, label: string): string {
  const text = String(value ?? '').trim();
  if (!/^\d+$/.test(text) || Number(text) <= 0) {
    throw new Error(
      `${label}には有効な正の整数を指定してください。 / Specify a valid positive integer for ${label}.`,
    );
  }
  return text;
}

export function optionalPositiveInteger(value: unknown, label: string): string | undefined {
  const text = String(value ?? '').trim();
  if (!text) return undefined;
  return positiveInteger(text, label);
}

export function parseJsonObject(value: unknown, label: string): IDataObject {
  const parsed = parseJsonValue(value, label);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error(`${label}はオブジェクトで指定してください。 / ${label} must be an object.`);
  }
  return parsed as IDataObject;
}

export function parseJsonArray(value: unknown, label: string): IDataObject[] {
  const parsed = parseJsonValue(value, label);
  if (!Array.isArray(parsed)) {
    throw new Error(`${label}は配列で指定してください。 / ${label} must be an array.`);
  }
  return parsed as IDataObject[];
}

function parseJsonValue(value: unknown, label: string): unknown {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  try {
    return JSON.parse(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `${label}のJSON形式が正しくありません: ${detail} / Invalid JSON format for ${label}: ${detail}`,
    );
  }
}

export function validateMax100(records: IDataObject[], label: string): void {
  if (records.length < 1) {
    throw new Error(`${label}を1件以上指定してください。 / Specify at least one ${label}.`);
  }
  if (records.length > 100) {
    throw new Error(
      `${label}は100件以下で指定してください。 / Specify no more than 100 ${label}.`,
    );
  }
}
