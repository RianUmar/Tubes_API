declare module 'jsonwebtoken' {
  export function verify(token: string, secret: string): any;
  export function sign(payload: any, secret: string, options?: any): string;
}