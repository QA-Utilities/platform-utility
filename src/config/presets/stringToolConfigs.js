export const PASSWORD_CHAR_GROUPS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  number: "0123456789",
  special: "!@#$%&*()-_=+[]{}<>?"
};

export const PASSWORD_PATTERNS = {
  basic: {
    title: "Padrao 1",
    label: "8+ caracteres, 1 letra maiuscula e 1 minuscula",
    config: { upper: true, lower: true, number: false, special: false }
  },
  special: {
    title: "Padrao 2",
    label: "8+ caracteres, 1 maiuscula, 1 minuscula e 1 especial",
    config: { upper: true, lower: true, number: false, special: true }
  },
  strong: {
    title: "Padrao 3",
    label: "8+ caracteres, 1 maiuscula, 1 minuscula, 1 especial e 1 numero",
    config: { upper: true, lower: true, number: true, special: true }
  }
};

export const INVALID_EMAIL_PATTERNS = {
  localParts: [
    "usuario",
    "joaosilva",
    "maria.souza",
    "nome",
    "contato",
    "qa.teste",
    "suporte",
    "cliente"
  ],
  domainParts: ["dominio", "gmail", "empresa", "mail", "teste", "portal", "service"],
  tlds: ["com", "net", "org", "io", "com.br", "dev"]
};

export const STRING_TOOL_SECTION_OPTIONS = [
  { value: "password", label: "Criar senha" },
  { value: "counter", label: "Contador de caracteres" },
  { value: "invalid-email", label: "Gerador de emails invalidos" },
  { value: "occurrence", label: "Contador de ocorrencia de palavra" }
];
