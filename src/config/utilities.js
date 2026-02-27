export const utilities = [
  {
    id: "file",
    path: "/",
    label: "Criar Arquivo",
    description: "Gerar arquivos de teste em texto, PDF e imagem",
    icon: "TXT"
  },
  {
    id: "json",
    path: "/json",
    label: "JSON",
    description: "Gerar, validar e formatar payloads",
    icon: "{}"
  },
  {
    id: "jwt",
    path: "/jwt",
    label: "JWT Tool",
    description: "Decodificar, validar e gerar token JWT HS256",
    icon: "JWT"
  },
  {
    id: "hash-hmac",
    path: "/hash-hmac",
    label: "Hash & HMAC",
    description: "Gerar hash e HMAC com algoritmos SHA",
    icon: "HSH"
  },
  {
    id: "mock-api",
    path: "/mock-api",
    label: "Mock Request",
    description: "Popular JSON automaticamente com dados mock",
    icon: "MOCK"
  },
  {
    id: "webhook",
    path: "/webhook-simulator",
    label: "Webhook Simulator",
    description: "Simular webhook com assinatura, headers e cURL",
    icon: "WHK"
  },
  {
    id: "fake-data",
    path: "/dados-fake",
    label: "Dados Fake",
    description: "Criar pessoa, cartao e veiculo para testes",
    icon: "FAKE"
  },
  {
    id: "compare",
    path: "/comparar-valor",
    label: "Comparar Valores",
    description: "Encontrar mudancas entre respostas",
    icon: "DIFF"
  },
  {
    id: "security-payloads",
    path: "/security-payloads",
    label: "Security Payloads",
    description: "Colecao de payloads SQL Injection e XSS para testes",
    icon: "SEC"
  },
  {
    id: "test-case-generator",
    path: "/test-case-generator",
    label: "Test Case Generator",
    description: "Analisar regra e gerar casos completos com Gherkin",
    icon: "TST"
  },
  {
    id: "compress",
    path: "/comprimir",
    label: "Comprimir",
    description: "Reduzir tamanho de anexos e logs",
    icon: "GZ"
  },
  {
    id: "base64",
    path: "/base64",
    label: "Base64",
    description: "Converter arquivos em texto Base64",
    icon: "64"
  },
  {
    id: "qrcode",
    path: "/qrcode",
    label: "QR Code",
    description: "Gerar QR Code aleatorio para testes",
    icon: "QR"
  },
  {
    id: "string",
    path: "/string",
    label: "String",
    description: "Gerar senha e contadores de texto",
    icon: "STR"
  },
  {
    id: "color-picker",
    path: "/color-picker",
    label: "Color Picker",
    description: "Converter entre RGB, HEX, HSL, HSV e CMYK",
    icon: "CLR"
  }
];

export function getUtilityByPath(pathname) {
  return utilities.find((item) => item.path === pathname) || utilities[0];
}
