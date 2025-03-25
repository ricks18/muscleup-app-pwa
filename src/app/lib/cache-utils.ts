/**
 * Limpa o cache do navegador para dados específicos da aplicação
 * @returns Promise que resolve quando o cache for limpo
 */
export async function clearAppCache(): Promise<void> {
  if (typeof window === "undefined" || !navigator.serviceWorker) {
    return Promise.resolve();
  }

  try {
    // Limpar caches específicos da aplicação
    const cacheKeys = [
      "apis",
      "next-data",
      "others",
      "static-js-assets",
      "static-style-assets",
    ];

    const cachePromises = cacheKeys.map(async (cacheName) => {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        return Promise.all(keys.map((request) => cache.delete(request)));
      } catch (error) {
        console.warn(`Erro ao limpar cache '${cacheName}':`, error);
        return Promise.resolve();
      }
    });

    await Promise.all(cachePromises);

    // Atualizar o service worker se estiver disponível
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" });
    }

    return Promise.resolve();
  } catch (error) {
    console.error("Erro ao limpar cache da aplicação:", error);
    return Promise.reject(error);
  }
}

/**
 * Atualiza a aplicação forçando um recarregamento das páginas
 * @returns Promise que resolve quando a aplicação for atualizada
 */
export async function forceAppUpdate(): Promise<void> {
  await clearAppCache();

  if (typeof window !== "undefined") {
    window.location.reload();
  }

  return Promise.resolve();
}
