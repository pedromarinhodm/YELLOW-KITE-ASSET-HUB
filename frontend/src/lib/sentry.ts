import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE;

/**
 * Inicializa o Sentry para tracking de erros em produção
 */
export function initSentry() {
  // Só inicializa em produção se o DSN estiver configurado
  if (!SENTRY_DSN || ENVIRONMENT === 'development') {
    console.info('Sentry: modo desabilitado (development ou DSN não configurado)');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    
    // Performance monitoring
    tracesSampleRate: 0.1, // 10% das transações em produção
    
    // Session replay para debug de UX
    replaysSessionSampleRate: 0.1, // 10% das sessões
    replaysOnErrorSampleRate: 1.0, // 100% quando há erro
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Filtra erros conhecidos que não são críticos
    beforeSend(event, hint) {
      const error = hint.originalException;
      
      // Ignora erros de extensões do browser
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String((error as Error).message).toLowerCase();
        if (
          message.includes('extension') ||
          message.includes('chrome-extension') ||
          message.includes('moz-extension')
        ) {
          return null;
        }
      }
      
      return event;
    },
  });
  
  console.info('Sentry: inicializado com sucesso');
}

/**
 * Configura contexto do usuário para rastreamento
 */
export function setSentryUser(userId: string, email?: string, role?: string) {
  Sentry.setUser({
    id: userId,
    email: email,
    role: role,
  });
}

/**
 * Limpa contexto do usuário (logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Adiciona contexto personalizado a eventos
 */
export function setSentryContext(key: string, data: Record<string, unknown>) {
  Sentry.setContext(key, data);
}

/**
 * Captura exceção manualmente
 */
export function captureException(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}
