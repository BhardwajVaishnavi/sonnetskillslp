declare module "@cashfreepayments/cashfree-js" {
  export type CheckoutOptions = {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_top" | "_modal" | HTMLElement;
  };
  export type Cashfree = {
    checkout(options: CheckoutOptions): Promise<{ error?: { message?: string }; redirect?: boolean }>;
  };
  export function load(options: { mode: "sandbox" | "production" }): Promise<Cashfree | null>;
}
