// n8n Webhook Integration Service
// Configure the webhook URLs from your n8n workflows

const N8N_WEBHOOK_URLS = {
  sendOnboardingTerm: import.meta.env.VITE_N8N_WEBHOOK_ONBOARDING || '',
  sendOffboardingTerm: import.meta.env.VITE_N8N_WEBHOOK_OFFBOARDING || '',
};

export interface TermEmailPayload {
  type: 'onboarding' | 'offboarding';
  employee: {
    name: string;
    email: string;
    role: string;
    department: string;
  };
  equipments: {
    name: string;
    serialNumber: string;
    purchaseValue: number;
    condition?: string;
    destination?: string;
  }[];
  term: string;
  date: string;
  totalValue: number;
  movementType?: 'kit' | 'avulsa';
  returnDeadline?: string;
}

export const webhookService = {
  /**
   * Sends the onboarding/offboarding term to the employee's email via n8n webhook.
   * Returns true if the webhook was called successfully.
   */
  sendTermByEmail: async (payload: TermEmailPayload): Promise<boolean> => {
    const webhookUrl = payload.type === 'onboarding'
      ? N8N_WEBHOOK_URLS.sendOnboardingTerm
      : N8N_WEBHOOK_URLS.sendOffboardingTerm;

    if (!webhookUrl) {
      throw new Error(
        `Webhook n8n não configurado para ${payload.type}. ` +
        `Configure a variável VITE_N8N_WEBHOOK_${payload.type.toUpperCase()} no ambiente.`
      );
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        sentAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao enviar para n8n: ${response.status} ${response.statusText}`);
    }

    return true;
  },

  /**
   * Check if n8n webhooks are configured
   */
  isConfigured: (type: 'onboarding' | 'offboarding'): boolean => {
    const url = type === 'onboarding'
      ? N8N_WEBHOOK_URLS.sendOnboardingTerm
      : N8N_WEBHOOK_URLS.sendOffboardingTerm;
    return !!url;
  },
};
