import { PostgrestError, PostgrestResponse } from '@supabase/supabase-js';
import { withTimeout, getErrorMessage, DEFAULT_REQUEST_TIMEOUT_MS } from './request';
import { logger } from './logger';

export interface ApiClientOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  flow?: string;
}

const DEFAULT_OPTIONS: Required<Omit<ApiClientOptions, 'flow'>> = {
  retries: 3,
  retryDelay: 1000,
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
};

/**
 * Determina se o erro é transitório e devemos fazer retry
 */
function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : '';

  const normalized = message.toLowerCase();

  // Erros de rede/conexão são retryable
  if (
    normalized.includes('network') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('timeout') ||
    normalized.includes('econnrefused') ||
    normalized.includes('etimedout')
  ) {
    return true;
  }

  // PostgrestError com códigos específicos
  if ((error as PostgrestError)?.code) {
    const code = (error as PostgrestError).code;
    // 08XXX = Connection Exception no PostgreSQL
    // 53XXX = Insufficient Resources
    // 57XXX = Operator Intervention (server shutdown, etc)
    return code.startsWith('08') || code.startsWith('53') || code.startsWith('57');
  }

  return false;
}

/**
 * Sleep com exponential backoff
 */
function sleep(ms: number, attempt: number): Promise<void> {
  // Exponential backoff: delay * (2 ^ attempt) com max de 10s
  const backoffMs = Math.min(ms * Math.pow(2, attempt), 10000);
  return new Promise(resolve => setTimeout(resolve, backoffMs));
}

/**
 * Cliente centralizado para chamadas API com retry, timeout e observabilidade
 */
export class ApiClient {
  async execute<T>(
    operation: string,
    fn: () => Promise<PostgrestResponse<T>>,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();
    let lastError: unknown;

    for (let attempt = 0; attempt <= opts.retries; attempt++) {
      try {
        logger.debug(`API call: ${operation}`, {
          flow: opts.flow,
          operation,
          attempt: attempt + 1,
          max_retries: opts.retries + 1,
        });

        const result = await withTimeout(fn(), opts.timeout);

        if (result.error) {
          throw result.error;
        }

        const duration = Date.now() - startTime;
        logger.metric(operation, true, duration, {
          flow: opts.flow,
          attempt: attempt + 1,
        });

        return result.data as T;
      } catch (error) {
        lastError = error;
        const isRetryable = isRetryableError(error);
        const isLastAttempt = attempt === opts.retries;

        logger.warn(`API call failed: ${operation}`, {
          flow: opts.flow,
          operation,
          attempt: attempt + 1,
          max_retries: opts.retries + 1,
          is_retryable: isRetryable,
          is_last_attempt: isLastAttempt,
          error: error instanceof Error ? error.message : String(error),
        });

        // Se não é retryable ou é a última tentativa, lança o erro
        if (!isRetryable || isLastAttempt) {
          const duration = Date.now() - startTime;
          logger.metric(operation, false, duration, {
            flow: opts.flow,
            error: error,
            attempts: attempt + 1,
          });

          throw error;
        }

        // Wait antes do próximo retry
        await sleep(opts.retryDelay, attempt);
      }
    }

    // Fallback (não deveria chegar aqui)
    throw lastError;
  }

  /**
   * Wrapper para RPC calls
   */
  async rpc<T>(
    functionName: string,
    args?: Record<string, unknown>,
    options: ApiClientOptions = {}
  ): Promise<T> {
    return this.execute(
      `rpc.${functionName}`,
      async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        return (supabase.rpc as any)(functionName, args) as Promise<PostgrestResponse<T>>;
      },
      options
    );
  }

  /**
   * Normaliza erro para mensagem user-friendly
   */
  handleError(error: unknown, operation: string, fallback: string): string {
    logger.error(`Error in ${operation}`, {
      operation,
      error,
    });

    return getErrorMessage(error, fallback);
  }
}

export const apiClient = new ApiClient();
