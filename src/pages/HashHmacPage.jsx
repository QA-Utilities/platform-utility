import { useState } from "react";
import {
  HASH_ALGORITHMS,
  HASH_DEFAULT_SECRET,
  HASH_DEFAULT_TEXT,
  HASH_OUTPUT_FORMATS
} from "../config/presets/hashHmacConfigs";
import "../styles/pages/hash-hmac-page.css";

function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

function formatOutput(buffer, outputFormat) {
  if (outputFormat === "base64") return arrayBufferToBase64(buffer);
  return arrayBufferToHex(buffer);
}

async function computeHash(text, algorithm, outputFormat) {
  if (!window.crypto?.subtle) {
    throw new Error("Web Crypto indisponivel neste navegador.");
  }
  const input = new TextEncoder().encode(text);
  const digest = await window.crypto.subtle.digest(algorithm, input);
  return formatOutput(digest, outputFormat);
}

async function computeHmac(text, secret, algorithm, outputFormat) {
  if (!window.crypto?.subtle) {
    throw new Error("Web Crypto indisponivel neste navegador.");
  }

  const key = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"]
  );

  const signature = await window.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text));
  return formatOutput(signature, outputFormat);
}

async function copyText(value, setMessage, successMessage, emptyMessage) {
  if (!value) {
    setMessage(emptyMessage);
    return;
  }
  if (!navigator.clipboard) {
    setMessage("Clipboard indisponivel neste navegador.");
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    setMessage(successMessage);
  } catch {
    setMessage("Nao foi possivel copiar.");
  }
}

export default function HashHmacPage() {
  const [inputText, setInputText] = useState(HASH_DEFAULT_TEXT);
  const [secret, setSecret] = useState(HASH_DEFAULT_SECRET);
  const [algorithm, setAlgorithm] = useState(HASH_ALGORITHMS[1].value);
  const [outputFormat, setOutputFormat] = useState(HASH_OUTPUT_FORMATS[0].value);
  const [hashOutput, setHashOutput] = useState("");
  const [hmacOutput, setHmacOutput] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const generateHash = async () => {
    try {
      const result = await computeHash(inputText, algorithm, outputFormat);
      setHashOutput(result);
      setStatusMessage("Hash gerado com sucesso.");
    } catch (error) {
      setStatusMessage(`Falha ao gerar hash: ${error.message}`);
    }
  };

  const generateHmac = async () => {
    if (!secret.trim()) {
      setStatusMessage("Informe o segredo para gerar HMAC.");
      return;
    }
    try {
      const result = await computeHmac(inputText, secret, algorithm, outputFormat);
      setHmacOutput(result);
      setStatusMessage("HMAC gerado com sucesso.");
    } catch (error) {
      setStatusMessage(`Falha ao gerar HMAC: ${error.message}`);
    }
  };

  const clearOutputs = () => {
    setHashOutput("");
    setHmacOutput("");
    setStatusMessage("Saidas limpas.");
  };

  return (
    <section className="card hash-hmac-page">
      <article className="hash-hmac-block">
        <h2>Hash e HMAC</h2>
        <p className="hash-hmac-caption">
          Gere hash e assinatura HMAC usando algoritmos SHA.
        </p>

        <label>
          Texto de entrada
          <textarea
            rows={8}
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder="Digite o texto que sera processado"
          />
        </label>

        <div className="hash-hmac-grid">
          <label>
            Algoritmo
            <select value={algorithm} onChange={(event) => setAlgorithm(event.target.value)}>
              {HASH_ALGORITHMS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Formato da saida
            <select value={outputFormat} onChange={(event) => setOutputFormat(event.target.value)}>
              {HASH_OUTPUT_FORMATS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Segredo para HMAC
          <input
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="Informe o secret para HMAC"
          />
        </label>

        <div className="hash-hmac-actions">
          <button type="button" onClick={generateHash}>
            Gerar hash
          </button>
          <button type="button" onClick={generateHmac}>
            Gerar HMAC
          </button>
          <button type="button" onClick={clearOutputs}>
            Limpar saidas
          </button>
        </div>

        {statusMessage && <p className="hash-hmac-message">{statusMessage}</p>}
      </article>

      <article className="hash-hmac-block">
        <div className="hash-hmac-output">
          <div className="hash-hmac-output-header">
            <strong>Resultado hash</strong>
            <button
              type="button"
              onClick={() =>
                copyText(hashOutput, setStatusMessage, "Hash copiado.", "Nenhum hash para copiar.")
              }
              disabled={!hashOutput}
            >
              Copiar hash
            </button>
          </div>
          <textarea rows={8} readOnly value={hashOutput} placeholder="Hash sera exibido aqui" />
        </div>

        <div className="hash-hmac-output">
          <div className="hash-hmac-output-header">
            <strong>Resultado HMAC</strong>
            <button
              type="button"
              onClick={() =>
                copyText(hmacOutput, setStatusMessage, "HMAC copiado.", "Nenhum HMAC para copiar.")
              }
              disabled={!hmacOutput}
            >
              Copiar HMAC
            </button>
          </div>
          <textarea rows={8} readOnly value={hmacOutput} placeholder="HMAC sera exibido aqui" />
        </div>
      </article>
    </section>
  );
}
