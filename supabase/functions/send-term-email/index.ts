/// <reference path="./modules.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TermEmailPayload {
  type: "onboarding" | "offboarding";
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
  movementType?: "kit" | "avulsa";
  returnDeadline?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SMTP_HOST = Deno.env.get("SMTP_HOST");
    const SMTP_PORT = Deno.env.get("SMTP_PORT");
    const SMTP_USER = Deno.env.get("SMTP_USER");
    const SMTP_PASS = Deno.env.get("SMTP_PASS");
    const SMTP_FROM_EMAIL = Deno.env.get("SMTP_FROM_EMAIL");
    const SMTP_FROM_NAME = Deno.env.get("SMTP_FROM_NAME") || "Yellow Kite";

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM_EMAIL) {
      throw new Error("Credenciais SMTP não configuradas. Verifique os secrets.");
    }

    const payload: TermEmailPayload = await req.json();

    const subject =
      payload.type === "onboarding"
        ? `Termo de Responsabilidade - ${payload.employee.name}`
        : `Termo de Devolução - ${payload.employee.name}`;

    const port = Number.parseInt(SMTP_PORT, 10);
    if (Number.isNaN(port)) {
      throw new Error("SMTP_PORT invÃ¡lida. Use um nÃºmero inteiro.");
    }

    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port,
        tls: port === 465,
        auth: {
          username: SMTP_USER,
          password: SMTP_PASS,
        },
      },
    });

    // Convert plain text term to HTML for reliable rendering
    const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Courier New', Courier, monospace; font-size: 14px; line-height: 1.6; color: #333; padding: 20px;">
<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: inherit; margin: 0;">${payload.term.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;

    await client.send({
      from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
      to: payload.employee.email,
      subject,
      html: htmlContent,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true, message: `E-mail enviado para ${payload.employee.email}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Erro ao enviar e-mail:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
