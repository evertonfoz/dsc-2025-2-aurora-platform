declare module 'argon2' {
  export function hash(data: string | Buffer): Promise<string>;
  export function verify(hash: string, data: string | Buffer): Promise<boolean>;
}
