export const FILE_TYPES = {
  txt: {
    label: "TXT",
    extensions: ["txt"],
    mime: "text/plain;charset=utf-8",
    defaultName: "arquivo-teste.txt",
    helper: "Arquivo de texto simples para validar uploads e leitura de logs."
  },
  html: {
    label: "HTML",
    extensions: ["html"],
    mime: "text/html;charset=utf-8",
    defaultName: "pagina-teste.html",
    helper: "Pagina HTML pequena para testes de renderizacao e parser."
  },
  pdf: {
    label: "PDF",
    extensions: ["pdf"],
    mime: "application/pdf",
    defaultName: "relatorio-teste.pdf",
    helper: "PDF valido de uma pagina com texto basico para testes."
  },
  png: {
    label: "PNG",
    extensions: ["png"],
    mime: "image/png",
    defaultName: "imagem-teste.png",
    helper: "Imagem PNG simples (320x180) para validar upload e preview."
  },
  jpeg: {
    label: "JPEG",
    extensions: ["jpg", "jpeg"],
    mime: "image/jpeg",
    defaultName: "imagem-teste.jpg",
    helper: "Imagem JPEG simples (320x180) para validar upload e preview."
  }
};

export const SIZE_OPTIONS_MB = [10, 20, 30, 40, 50];
