declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
  ): void;
}

declare module "https://deno.land/x/denomailer@1.6.0/mod.ts" {
  export class SMTPClient {
    constructor(options: {
      connection: {
        hostname: string;
        port: number;
        tls?: boolean;
        auth?: {
          username: string;
          password: string;
        };
      };
    });
    send(options: {
      from: string;
      to: string | string[];
      subject: string;
      html?: string;
      content?: string;
    }): Promise<void>;
    close(): Promise<void>;
  }
}
