export const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  timeoutMessage = 'A requisição demorou demais para responder. Tente novamente.'
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!error) return fallback;

  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : fallback;

  const normalized = message.toLowerCase();

  if (normalized.includes('timeout') || normalized.includes('demorou')) {
    return 'Tempo de resposta excedido. Verifique sua conexão e tente novamente.';
  }

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network') ||
    normalized.includes('fetch')
  ) {
    return 'Falha de conexão com o servidor. Verifique a internet e tente novamente.';
  }

  return message || fallback;
};
