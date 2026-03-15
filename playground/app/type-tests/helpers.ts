export type IsExact<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false

export function expectType<_T extends true>(): void {}
