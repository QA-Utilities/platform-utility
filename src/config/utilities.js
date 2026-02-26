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
  }
];

export function getUtilityByPath(pathname) {
  return utilities.find((item) => item.path === pathname) || utilities[0];
}
