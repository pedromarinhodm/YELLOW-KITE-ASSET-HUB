// Email Service via SMTP (Hostinger)
// Sends terms via Supabase Edge Function

import { supabase } from '@/integrations/supabase/client';

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

export const emailService = {
  /**
   * Sends the onboarding/offboarding term to the employee's email via SMTP.
   */
  sendTermByEmail: async (payload: TermEmailPayload): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke('send-term-email', {
      body: payload,
    });

    if (error) {
      throw new Error(error.message || 'Erro ao enviar e-mail');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Erro ao enviar e-mail');
    }

    return true;
  },
};

// Keep backward compatibility
export const webhookService = emailService;
