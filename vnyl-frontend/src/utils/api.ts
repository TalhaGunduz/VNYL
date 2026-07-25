const BASE_URL = 'http://127.0.0.1:8000';

/**
 * Merkezi API çağrı yardımcısı.
 * Laravel'in HTML redirect yerine JSON döndürmesi için
 * her çağrıya otomatik olarak "Accept: application/json" header'ı ekler.
 */
export function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('token');

    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> ?? {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });
}
