import type { Credentials, Notification } from '../types';

export const DEFAULT_API_URL = 'https://api.green-api.com/v3';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function methodUrl(creds: Credentials, method: string, suffix = ''): string {
  const base = creds.apiUrl.replace(/\/+$/, '');
  return `${base}/waInstance${creds.idInstance}/${method}/${creds.apiTokenInstance}${suffix}`;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const hint =
      res.status === 401 || res.status === 403
        ? 'Check idInstance and apiTokenInstance'
        : detail || res.statusText;
    throw new ApiError(`GREEN-API error ${res.status}: ${hint}`, res.status);
  }
  // Some methods (ReceiveNotification with an empty queue) answer with an empty body or "null".
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export function getStateInstance(creds: Credentials) {
  return request<{ stateInstance: string }>(methodUrl(creds, 'getStateInstance'));
}

export function checkAccount(creds: Credentials, phoneNumber: string) {
  return request<{ exist: boolean; chatId: string }>(methodUrl(creds, 'checkAccount'), {
    method: 'POST',
    body: JSON.stringify({ phoneNumber: Number(phoneNumber) }),
  });
}

export function sendMessage(creds: Credentials, chatId: string, message: string) {
  return request<{ idMessage: string }>(methodUrl(creds, 'sendMessage'), {
    method: 'POST',
    body: JSON.stringify({ chatId, message }),
  });
}

export function receiveNotification(creds: Credentials, signal?: AbortSignal, receiveTimeout = 5) {
  return request<Notification | null>(
    methodUrl(creds, 'receiveNotification', `?receiveTimeout=${receiveTimeout}`),
    { signal },
  );
}

export function deleteNotification(creds: Credentials, receiptId: number) {
  return request<{ result: boolean }>(methodUrl(creds, 'deleteNotification', `/${receiptId}`), {
    method: 'DELETE',
  });
}
