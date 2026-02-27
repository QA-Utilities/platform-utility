export const TEST_CASE_DEFAULT_RULE = `Regra: Cadastro de usuario
- Campos obrigatorios: nome, email e senha.
- Email deve ter formato valido.
- Senha deve ter no minimo 8 caracteres e no maximo 20.
- Senha deve conter letra maiuscula, minuscula, numero e caractere especial.
- Email nao pode ser duplicado.
- Quando cadastro for valido, retornar status 201.
- Quando houver erro de validacao, retornar status 400.`;

export const TEST_CASE_CATEGORY_OPTIONS = [
  { value: "positive", label: "Positivo" },
  { value: "negative", label: "Negativo" },
  { value: "boundary", label: "Borda" },
  { value: "security", label: "Seguranca" },
  { value: "regression", label: "Regressao" }
];

export const TEST_CASE_TARGET_OPTIONS = [
  { value: "backend", label: "Backend (API)" },
  { value: "frontend", label: "Frontend (UI)" },
  { value: "both", label: "Ambos" }
];

export const TEST_CASE_PRIORITY_BY_CATEGORY = {
  positive: "Alta",
  negative: "Alta",
  boundary: "Media",
  security: "Alta",
  regression: "Media"
};

export const TEST_CASE_ANALYSIS_KEYWORDS = {
  required: [
    "obrigatorio",
    "obrigatorios",
    "obrigatoria",
    "required",
    "nao pode ser vazio",
    "nao pode ficar em branco",
    "must be provided"
  ],
  unique: ["nao pode ser duplicado", "unico", "unique", "duplicado"],
  auth: ["autenticacao", "autorizacao", "token", "login", "permissao", "forbidden", "unauthorized"],
  email: ["email", "e-mail"],
  phone: ["telefone", "phone", "celular", "mobile"],
  url: ["url", "link", "uri"],
  cpf: ["cpf"],
  cnpj: ["cnpj"],
  zipcode: ["cep", "zipcode", "postal"],
  date: ["data", "date", "hora", "time", "timestamp"],
  numeric: ["numero", "number", "valor", "amount", "quantidade", "idade"]
};

export const TEST_CASE_STOP_WORDS = [
  "regra",
  "campos",
  "campo",
  "deve",
  "dever",
  "quando",
  "com",
  "sem",
  "para",
  "entre",
  "retornar",
  "status",
  "codigo",
  "http",
  "json",
  "payload",
  "validacao",
  "erro",
  "sucesso",
  "request",
  "response",
  "valor",
  "dados",
  "dado",
  "informacao",
  "informacoes"
];

export const TEST_CASE_SECURITY_PAYLOAD_SAMPLES = {
  sqlInjection: "' OR '1'='1",
  xss: "<script>alert('xss')</script>"
};
