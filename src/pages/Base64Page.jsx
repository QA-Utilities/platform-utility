import { useState } from "react";
import "../styles/pages/base64-page.css";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, filename);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Falha ao ler o arquivo."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function inferExtensionFromMimeType(mimeType) {
  const normalized = (mimeType || "").toLowerCase();
  const map = {
    "text/plain": "txt",
    "text/html": "html",
    "application/xml": "xml",
    "image/svg+xml": "svg",
    "application/pdf": "pdf",
    "application/json": "json",
    "application/zip": "zip",
    "application/gzip": "gz",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "video/mp4": "mp4",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp"
  };
  return map[normalized] || "bin";
}

function resolveOutputFilename(filename, mimeType) {
  const trimmed = (filename || "").trim();
  const extension = inferExtensionFromMimeType(mimeType);

  if (!trimmed) return `arquivo-recuperado.${extension}`;
  if (trimmed.includes(".")) return trimmed;
  return `${trimmed}.${extension}`;
}

function startsWithBytes(bytes, signature) {
  if (bytes.length < signature.length) return false;
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[i] !== signature[i]) return false;
  }
  return true;
}

function isLikelyText(bytes) {
  const sampleSize = Math.min(bytes.length, 1024);
  if (sampleSize === 0) return false;

  let suspiciousCount = 0;
  for (let i = 0; i < sampleSize; i += 1) {
    const code = bytes[i];
    const isAllowedControl = code === 9 || code === 10 || code === 13;
    const isPrintableAscii = code >= 32 && code <= 126;

    if (!isAllowedControl && !isPrintableAscii) {
      suspiciousCount += 1;
    }
  }

  return suspiciousCount / sampleSize < 0.05;
}

function detectMimeTypeFromBytes(bytes) {
  if (startsWithBytes(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  if (startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38])) return "image/gif";
  if (startsWithBytes(bytes, [0x50, 0x4b, 0x03, 0x04])) return "application/zip";
  if (startsWithBytes(bytes, [0x50, 0x4b, 0x05, 0x06])) return "application/zip";
  if (startsWithBytes(bytes, [0x50, 0x4b, 0x07, 0x08])) return "application/zip";
  if (startsWithBytes(bytes, [0x1f, 0x8b])) return "application/gzip";

  if (
    bytes.length > 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  if (
    bytes.length > 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  ) {
    return "audio/wav";
  }

  if (
    bytes.length > 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return "video/mp4";
  }

  if (startsWithBytes(bytes, [0x49, 0x44, 0x33])) return "audio/mpeg";
  if (bytes.length > 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return "audio/mpeg";

  if (isLikelyText(bytes)) {
    const text = new TextDecoder("utf-8").decode(bytes.slice(0, 2048)).trimStart();
    const lower = text.toLowerCase();

    if (lower.startsWith("{") || lower.startsWith("[")) {
      return "application/json";
    }
    if (lower.startsWith("<!doctype html") || lower.startsWith("<html")) {
      return "text/html";
    }
    if (lower.startsWith("<svg")) {
      return "image/svg+xml";
    }
    if (lower.startsWith("<?xml")) {
      return "application/xml";
    }
    return "text/plain";
  }

  return "application/octet-stream";
}

function parseBase64Input(inputValue) {
  const trimmed = (inputValue || "").trim();
  if (!trimmed) {
    throw new Error("Cole um conteudo Base64 para converter.");
  }

  let mimeType = "application/octet-stream";
  let base64Part = trimmed;

  if (trimmed.startsWith("data:")) {
    const commaIndex = trimmed.indexOf(",");
    if (commaIndex === -1) {
      throw new Error("Data URL invalida.");
    }

    const header = trimmed.slice(0, commaIndex);
    if (!/;base64/i.test(header)) {
      throw new Error("Data URL sem marcador base64.");
    }

    const mimeMatch = header.match(/^data:([^;]+)/i);
    if (mimeMatch?.[1]) {
      mimeType = mimeMatch[1].toLowerCase();
    }

    base64Part = trimmed.slice(commaIndex + 1);
  }

  let normalized = base64Part.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!normalized) {
    throw new Error("Base64 vazio.");
  }

  const padLength = normalized.length % 4;
  if (padLength > 0) {
    normalized = normalized.padEnd(normalized.length + (4 - padLength), "=");
  }

  let binary;
  try {
    binary = window.atob(normalized);
  } catch {
    throw new Error("Base64 invalido.");
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  if (mimeType === "application/octet-stream") {
    mimeType = detectMimeTypeFromBytes(bytes);
  }

  return { bytes, mimeType };
}

export default function Base64Page() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [base64Output, setBase64Output] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [includeDataUrl, setIncludeDataUrl] = useState(false);
  const [reverseBase64Input, setReverseBase64Input] = useState("");
  const [reverseFilename, setReverseFilename] = useState("arquivo-recuperado");
  const [reverseMimeType, setReverseMimeType] = useState("");

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setSelectedFile(nextFile);
    setBase64Output("");
    setStatusMessage(nextFile ? `Arquivo selecionado: ${nextFile.name}` : "");
  };

  const convertToBase64 = async () => {
    if (!selectedFile) {
      setStatusMessage("Selecione um arquivo primeiro.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(selectedFile);
      const rawBase64 = dataUrl.split(",")[1] || "";
      const output = includeDataUrl ? dataUrl : rawBase64;
      setBase64Output(output);
      setStatusMessage(`Arquivo convertido: ${selectedFile.name}`);
    } catch (error) {
      setStatusMessage(`Falha na conversao: ${error.message}`);
    }
  };

  const copyBase64 = async () => {
    if (!base64Output) {
      setStatusMessage("Nenhum conteudo Base64 para copiar.");
      return;
    }

    if (!navigator.clipboard) {
      setStatusMessage("Clipboard indisponivel neste navegador.");
      return;
    }

    try {
      await navigator.clipboard.writeText(base64Output);
      setStatusMessage("Base64 copiado para a area de transferencia.");
    } catch {
      setStatusMessage("Nao foi possivel copiar o Base64.");
    }
  };

  const downloadBase64 = () => {
    if (!base64Output) {
      setStatusMessage("Nenhum conteudo Base64 para baixar.");
      return;
    }

    const outputName = selectedFile ? `${selectedFile.name}.base64.txt` : "arquivo.base64.txt";
    downloadTextFile(base64Output, outputName);
    setStatusMessage(`Arquivo salvo: ${outputName}`);
  };

  const convertBase64ToFile = () => {
    try {
      const { bytes, mimeType } = parseBase64Input(reverseBase64Input);
      const outputName = resolveOutputFilename(reverseFilename, mimeType);
      const blob = new Blob([bytes], { type: mimeType });
      downloadBlob(blob, outputName);
      setReverseMimeType(mimeType);
      setStatusMessage(`Arquivo reconstruido: ${outputName} (${bytes.length} bytes).`);
    } catch (error) {
      setStatusMessage(`Falha na conversao reversa: ${error.message}`);
    }
  };

  return (
    <section className="card base64-page">
      <h2>Converter arquivo para Base64</h2>
      <p>Selecione um arquivo e gere o conteudo em Base64 para copiar ou baixar.</p>

      <input type="file" onChange={handleFileChange} />

      <label className="base64-option">
        <input
          type="checkbox"
          checked={includeDataUrl}
          onChange={(e) => setIncludeDataUrl(e.target.checked)}
        />
        Incluir prefixo data URL
      </label>

      <div className="base64-actions">
        <button type="button" onClick={convertToBase64}>
          Converter para Base64
        </button>
        <button type="button" onClick={downloadBase64} disabled={!base64Output}>
          Baixar .txt
        </button>
      </div>

      {selectedFile && <small className="base64-file-info">Arquivo: {selectedFile.name}</small>}
      {base64Output && (
        <small className="base64-size">Tamanho do texto: {base64Output.length} caracteres</small>
      )}
      {statusMessage && <p className="base64-message">{statusMessage}</p>}

      <div className="base64-output">
        <div className="base64-output-header">
          <span>Resultado Base64</span>
          <button type="button" onClick={copyBase64} disabled={!base64Output}>
            Copiar Base64
          </button>
        </div>
        <textarea rows={12} readOnly value={base64Output} />
      </div>

      <div className="base64-reverse">
        <h2>Converter Base64 para arquivo</h2>
        <p>Cole o Base64 (puro ou data URL), defina um nome e gere o arquivo para download.</p>

        <label>
          Nome do arquivo de saida
          <input
            value={reverseFilename}
            onChange={(event) => setReverseFilename(event.target.value)}
            placeholder="arquivo-recuperado"
          />
        </label>

        <label>
          Base64 de entrada
          <textarea
            rows={10}
            value={reverseBase64Input}
            onChange={(event) => setReverseBase64Input(event.target.value)}
            placeholder="Cole aqui o Base64 para reconstruir o arquivo"
          />
        </label>

        <button type="button" onClick={convertBase64ToFile} disabled={!reverseBase64Input.trim()}>
          Converter para arquivo e baixar
        </button>

        {reverseMimeType && <small className="base64-file-info">Tipo detectado: {reverseMimeType}</small>}
      </div>
    </section>
  );
}
