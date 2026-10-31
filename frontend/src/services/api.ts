/**
 * Camada de integração HTTP preparada para o backend Java + Spring Boot (/api/v1).
 * Enquanto o servidor Spring Boot não estiver rodando, a aplicação opera de forma
 * reativa local sem quebrar a experiência do usuário.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
      ...options,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    // Fallback silencioso para estado local enquanto o backend Spring Boot não está ativo
    return null;
  }
}
