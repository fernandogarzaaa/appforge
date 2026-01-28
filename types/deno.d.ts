/// <reference lib="deno.window" />

declare namespace Deno {
  function serve(options: ServeOptions | undefined, handler: ServeHandler): void;
  function serve(handler: ServeHandler): void;
  
  const env: Env;
  
  interface Env {
    get(key: string): string | undefined;
  }
  
  type ServeOptions = {
    port?: number;
    hostname?: string;
    signal?: AbortSignal;
  };
  
  type ServeHandler = (req: Request, info?: ConnInfo) => Response | Promise<Response>;
  
  interface ConnInfo {
    localAddr?: Addr;
    remoteAddr?: Addr;
  }
  
  interface Addr {
    transport: "tcp" | "unix";
    hostname?: string;
    port?: number;
    path?: string;
  }
}
