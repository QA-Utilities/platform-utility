import { useState } from "react";
import { FILE_TYPES, SIZE_OPTIONS_MB } from "../config/presets/fileToolConfigs";
import "../styles/pages/file-tool-page.css";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ensureExtension(name, extensions) {
  const trimmedName = (name || "").trim();
  const fallback = `arquivo.${extensions[0]}`;

  if (!trimmedName) return fallback;

  const lower = trimmedName.toLowerCase();
  const alreadyHasExtension = extensions.some((ext) => lower.endsWith(`.${ext}`));
  if (alreadyHasExtension) return trimmedName;

  return `${trimmedName}.${extensions[0]}`;
}

function toPdfSafeLine(value) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function byteLength(value) {
  return new TextEncoder().encode(value).length;
}

function mbToBytes(valueMb) {
  return valueMb * 1024 * 1024;
}

function getPresetBaseContent(type, sizeMb) {
  const now = new Date().toLocaleString("pt-BR");
  const kind = FILE_TYPES[type]?.label || "arquivo";
  return [
    `Arquivo padrao de ${sizeMb}MB`,
    `Tipo: ${kind}`,
    `Gerado para teste em ${now}`,
    "Este conteudo e usado automaticamente no modo de tamanho fixo."
  ].join("\n");
}

function buildSizedTextContent(targetBytes, baseText) {
  const prefix = `${baseText}\n\n`;
  const prefixBytes = byteLength(prefix);
  if (targetBytes <= prefixBytes) {
    return prefix.slice(0, targetBytes);
  }

  const fillerBytes = targetBytes - prefixBytes;
  const pattern = "QA_TEST_DATA_0123456789\n";
  const repeated = pattern.repeat(Math.ceil(fillerBytes / pattern.length)).slice(0, fillerBytes);
  return `${prefix}${repeated}`;
}

function buildSizedHtmlContent(targetBytes, baseText) {
  const header = [
    "<!doctype html>",
    "<html lang=\"pt-BR\">",
    "<head>",
    "  <meta charset=\"utf-8\">",
    "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    "  <title>Arquivo HTML de teste</title>",
    "</head>",
    "<body>",
    `  <h1>${baseText.split("\n")[0]}</h1>`,
    "  <p>Arquivo HTML gerado para teste de tamanho.</p>",
    "  <!--"
  ].join("\n");
  const footer = ["  -->", "</body>", "</html>"].join("\n");

  const minBytes = byteLength(header) + byteLength(footer);
  if (targetBytes <= minBytes) {
    return `${header}${footer}`;
  }

  const fillerBytes = targetBytes - minBytes;
  const filler = "X".repeat(fillerBytes);
  return `${header}${filler}${footer}`;
}

function padBlobToSize(blob, targetBytes) {
  if (blob.size >= targetBytes) return blob;
  const padding = new Uint8Array(targetBytes - blob.size);
  return new Blob([blob, padding], { type: blob.type });
}

function buildSimplePdf(content) {
  const linesFromInput = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);

  const lines =
    linesFromInput.length > 0
      ? linesFromInput
      : [
          "Arquivo de teste PDF",
          "Gerado pelo QA Utilities Hub",
          `Data: ${new Date().toLocaleString("pt-BR")}`
        ];

  const streamParts = ["BT", "/F1 14 Tf", "72 770 Td"];
  lines.forEach((line, index) => {
    if (index > 0) streamParts.push("0 -22 Td");
    streamParts.push(`(${toPdfSafeLine(line)}) Tj`);
  });
  streamParts.push("ET");
  const streamContent = streamParts.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${byteLength(streamContent)} >>\nstream\n${streamContent}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];

  objects.forEach((objectBody, index) => {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${objectBody}\nendobj\n`;
  });

  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function canvasToBlob(canvas, mime) {
  return new Promise((resolve, reject) => {
    const quality = mime === "image/jpeg" ? 0.92 : undefined;
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Falha ao montar a imagem."));
          return;
        }
        resolve(blob);
      },
      mime,
      quality
    );
  });
}

async function buildSimpleImage(content, mime) {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 180;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponivel neste navegador.");

  const gradient = ctx.createLinearGradient(0, 0, 320, 180);
  gradient.addColorStop(0, "#0f172a");
  gradient.addColorStop(1, "#115e59");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(248, 250, 252, 0.96)";
  ctx.fillRect(16, 16, canvas.width - 32, canvas.height - 32);

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const title = lines[0] || "Imagem de teste";
  const subtitle = lines[1] || "QA Utilities Hub";

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(title.slice(0, 26), 28, 72);
  ctx.font = "14px sans-serif";
  ctx.fillText(subtitle.slice(0, 34), 28, 98);
  ctx.font = "12px sans-serif";
  ctx.fillText(new Date().toLocaleString("pt-BR"), 28, 128);

  return canvasToBlob(canvas, mime);
}

function buildHtml(content) {
  if (content.trim()) return content;

  return [
    "<!doctype html>",
    "<html lang=\"pt-BR\">",
    "<head>",
    "  <meta charset=\"utf-8\">",
    "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    "  <title>Pagina de teste</title>",
    "</head>",
    "<body>",
    "  <h1>Pagina de teste</h1>",
    "  <p>Gerado pelo QA Utilities Hub.</p>",
    "</body>",
    "</html>"
  ].join("\n");
}

function replaceKnownExtension(name, nextType) {
  const allExtensions = Object.values(FILE_TYPES).flatMap((type) => type.extensions);
  const current = (name || "").trim();
  if (!current) return FILE_TYPES[nextType].defaultName;

  const lower = current.toLowerCase();
  const hasKnownExtension = allExtensions.some((ext) => lower.endsWith(`.${ext}`));
  if (!hasKnownExtension) return ensureExtension(current, FILE_TYPES[nextType].extensions);

  return current.replace(/\.[^.]+$/, `.${FILE_TYPES[nextType].extensions[0]}`);
}

export default function FileToolPage() {
  const [fileType, setFileType] = useState("txt");
  const [filename, setFilename] = useState(FILE_TYPES.txt.defaultName);
  const [fileContent, setFileContent] = useState("Arquivo de teste para validar funcionalidades.");
  const [useFixedSize, setUseFixedSize] = useState(false);
  const [selectedSizeMb, setSelectedSizeMb] = useState(10);
  const [statusMessage, setStatusMessage] = useState("");

  const presetContent = getPresetBaseContent(fileType, selectedSizeMb);
  const effectiveContent = useFixedSize ? presetContent : fileContent;

  const handleTypeChange = (nextType) => {
    setFileType(nextType);
    setFilename((current) => replaceKnownExtension(current, nextType));
    setStatusMessage("");
  };

  const createFile = async () => {
    const config = FILE_TYPES[fileType];
    const safeName = ensureExtension(filename, config.extensions);
    const content = effectiveContent || "Arquivo de teste";
    const targetBytes = useFixedSize ? mbToBytes(selectedSizeMb) : null;

    try {
      let blob;

      if (fileType === "txt") {
        const text = useFixedSize ? buildSizedTextContent(targetBytes, content) : content;
        blob = new Blob([text], { type: config.mime });
      } else if (fileType === "html") {
        const html = useFixedSize ? buildSizedHtmlContent(targetBytes, content) : buildHtml(content);
        blob = new Blob([html], { type: config.mime });
      } else if (fileType === "pdf") {
        blob = buildSimplePdf(content);
      } else if (fileType === "png" || fileType === "jpeg") {
        blob = await buildSimpleImage(content, config.mime);
      } else {
        throw new Error("Tipo de arquivo nao suportado.");
      }

      if (useFixedSize && (fileType === "pdf" || fileType === "png" || fileType === "jpeg")) {
        blob = padBlobToSize(blob, targetBytes);
      }

      downloadBlob(blob, safeName);
      if (useFixedSize) {
        setStatusMessage(`Arquivo criado: ${safeName} (${selectedSizeMb}MB)`);
      } else {
        setStatusMessage(`Arquivo criado: ${safeName}`);
      }
    } catch (error) {
      setStatusMessage(`Falha ao criar arquivo: ${error.message}`);
    }
  };

  return (
    <section className="card file-tool-page">
      <h2>Criar arquivos de teste</h2>
      <p className="file-tool-caption">
        Gere arquivos pequenos para validar upload, download e leitura em diferentes formatos.
      </p>

      <label>
        Tipo do arquivo
        <select value={fileType} onChange={(event) => handleTypeChange(event.target.value)}>
          {Object.entries(FILE_TYPES).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
      </label>

      <div className="file-size-controls">
        <label className="file-size-toggle">
          <input
            type="checkbox"
            checked={useFixedSize}
            onChange={(event) => {
              setUseFixedSize(event.target.checked);
              setStatusMessage("");
            }}
          />
          Definir tamanho do arquivo
        </label>

        <label>
          Tamanho alvo
          <select
            value={selectedSizeMb}
            onChange={(event) => setSelectedSizeMb(Number(event.target.value))}
            disabled={!useFixedSize}
          >
            {SIZE_OPTIONS_MB.map((sizeMb) => (
              <option key={sizeMb} value={sizeMb}>
                {sizeMb}MB
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Nome do arquivo
        <input value={filename} onChange={(event) => setFilename(event.target.value)} />
      </label>

      <label>
        Conteudo base
        <textarea
          value={effectiveContent}
          onChange={(event) => setFileContent(event.target.value)}
          rows={8}
          placeholder="Texto opcional para compor o arquivo de teste"
          disabled={useFixedSize}
        />
      </label>

      <p className="file-tool-hint">{FILE_TYPES[fileType].helper}</p>
      {useFixedSize && (
        <p className="file-tool-hint">
          Modo tamanho fixo ativo: o conteudo acima e padrao e o arquivo sera gerado com {selectedSizeMb}MB.
        </p>
      )}

      <button type="button" onClick={createFile}>
        Baixar arquivo de teste
      </button>

      {statusMessage && <p className="file-tool-message">{statusMessage}</p>}
    </section>
  );
}
