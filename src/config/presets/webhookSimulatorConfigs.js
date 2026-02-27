export const WEBHOOK_HTTP_METHODS = ["POST", "PUT", "PATCH"];

export const WEBHOOK_PROVIDERS = [
  {
    value: "generic",
    label: "Generic",
    description: "Formato generico com headers X-Webhook-*"
  },
  {
    value: "stripe",
    label: "Stripe-like",
    description: "Assina payload no formato t=timestamp,v1=signature"
  },
  {
    value: "github",
    label: "GitHub-like",
    description: "Assina payload e envia X-Hub-Signature-256"
  }
];

export const WEBHOOK_ALGORITHMS = [
  { value: "SHA-256", label: "SHA-256" },
  { value: "SHA-1", label: "SHA-1" },
  { value: "SHA-512", label: "SHA-512" }
];

export const WEBHOOK_DEFAULTS = {
  provider: "generic",
  method: "POST",
  endpoint: "https://example.com/webhook",
  eventType: "payment.succeeded",
  secret: "webhook-secret",
  algorithm: "SHA-256"
};

export const WEBHOOK_DEFAULT_PAYLOAD = {
  id: "evt_1001",
  object: "event",
  created: 1735689600,
  type: "payment.succeeded",
  data: {
    amount: 199.9,
    currency: "BRL",
    customer: "cus_98765",
    status: "paid"
  }
};
