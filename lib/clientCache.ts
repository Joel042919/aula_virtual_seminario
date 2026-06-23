const cache = new Map<string, { data: any, timestamp: number }>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos por defecto

/**
 * Función para envolver promesas (como Server Actions) con una caché en memoria en el cliente.
 * Se limpia automáticamente en hard-refreshes (SPA navigation preserva el estado).
 */
export async function withCache<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttl: number = CACHE_TTL
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key);
  
  // Si existe en caché y no ha expirado, retornamos la copia instantánea
  if (cached && (now - cached.timestamp < ttl)) {
    // Retornamos una promesa resuelta para mantener la firma async
    return Promise.resolve(cached.data as T);
  }
  
  // Si no existe o expiró, llamamos al backend
  const data = await fetcher();
  
  // Guardamos en caché
  cache.set(key, { data, timestamp: now });
  
  return data;
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
