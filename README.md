# QA Utilities Hub (React + GitHub Pages)

Pagina web em React para o time de QA com ferramentas uteis no navegador:

- Criar e baixar arquivo de texto
- Gerar JSON por campos
- Validar/formatar JSON
- Comparar dois JSONs
- Comprimir arquivo em `.gz`

## Como rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy no GitHub Pages

1. Crie o repositorio `tools-qa` (ou ajuste o `base` em `vite.config.js`).
2. Suba o codigo para a branch `main`.
3. Rode:

```bash
npm install
npm run deploy
```

Isso publica o conteudo da pasta `dist` na branch `gh-pages`.

## Observacao

Se o nome do seu repositorio nao for `tools-qa`, altere a propriedade `base` em `vite.config.js` para `/<nome-do-repo>/`.