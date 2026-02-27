import { useEffect, useMemo, useRef, useState } from "react";
import {
  JWT_DEFAULT_HEADER,
  JWT_DEFAULT_PAYLOAD_BASE,
  JWT_DEFAULT_SECRET,
  JWT_TIME_OFFSETS
} from "../config/presets/jwtToolConfigs";
import "../styles/pages/jwt-tool-page.css";

function toBase64Url(value) {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = normalized.length % 4;
  return normalized.padEnd(normalized.length + (padLength > 0 ? 4 - padLength : 0), "=");
}

function bytesToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return toBase64Url(window.btoa(binary));
}

function base64UrlToBytes(value) {
  const binary = window.atob(fromBase64Url(value));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function encodeJsonSegment(value) {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

function decodeJsonSegment(segment) {
  const bytes = base64UrlToBytes(segment);
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}

function buildDefaultPayload() {
  const now = Math.floor(Date.now() / 1000);
  return {
    ...JWT_DEFAULT_PAYLOAD_BASE,
    iat: now + JWT_TIME_OFFSETS.iat,
    exp: now + JWT_TIME_OFFSETS.exp
  };
}

function getJwtValidationNotes(payload) {
  const now = Math.floor(Date.now() / 1000);
  const notes = [];

  if (typeof payload.exp === "number") {
    if (now >= payload.exp) {
      notes.push(`exp expirado em ${new Date(payload.exp * 1000).toISOString()}`);
    } else {
      notes.push(`exp valido ate ${new Date(payload.exp * 1000).toISOString()}`);
    }
  }

  if (typeof payload.nbf === "number") {
    if (now < payload.nbf) {
      notes.push(`nbf ainda nao ativo ate ${new Date(payload.nbf * 1000).toISOString()}`);
    } else {
      notes.push("nbf ativo");
    }
  }

  if (typeof payload.iat === "number") {
    notes.push(`iat ${new Date(payload.iat * 1000).toISOString()}`);
  }

  return notes;
}

async function signHs256(unsignedToken, secret) {
  if (!window.crypto?.subtle) {
    throw new Error("Web Crypto indisponivel neste navegador.");
  }

  const key = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await window.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(unsignedToken));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifyHs256(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("JWT invalido. Use header.payload.signature");
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  const expected = await signHs256(`${headerPart}.${payloadPart}`, secret);
  return expected === signaturePart;
}

function parseJsonText(text, label) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error: `${label} invalido: ${error.message}` };
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightJson(source) {
  const tokenPattern = /"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],:]/g;
  let result = "";
  let lastIndex = 0;
  let match = tokenPattern.exec(source);

  while (match) {
    const token = match[0];
    const start = match.index;
    result += escapeHtml(source.slice(lastIndex, start));

    if (token.startsWith("\"")) {
      const isKey = /^\s*:/.test(source.slice(start + token.length));
      result += `<span class="${isKey ? "jwt-token-json-key" : "jwt-token-json-string"}">${escapeHtml(token)}</span>`;
    } else if (/^-?\d/.test(token)) {
      result += `<span class="jwt-token-json-number">${escapeHtml(token)}</span>`;
    } else if (token === "true" || token === "false") {
      result += `<span class="jwt-token-json-boolean">${token}</span>`;
    } else if (token === "null") {
      result += `<span class="jwt-token-json-null">${token}</span>`;
    } else {
      result += `<span class="jwt-token-json-punct">${escapeHtml(token)}</span>`;
    }

    lastIndex = start + token.length;
    match = tokenPattern.exec(source);
  }

  result += escapeHtml(source.slice(lastIndex));
  if (!source) return " ";
  return source.endsWith("\n") ? `${result}\n ` : result;
}

function JwtJsonEditor({ label, value, onChange, placeholder, rows = 12, readOnly = false, autoGrow = false }) {
  const [isFocused, setIsFocused] = useState(false);
  const lineNumbersRef = useRef(null);
  const highlightRef = useRef(null);
  const textareaRef = useRef(null);
  const showOverlay = readOnly || !isFocused;
  const lineNumbers = useMemo(() => {
    const lineCount = Math.max(1, value.replace(/\r\n/g, "\n").split("\n").length);
    return Array.from({ length: lineCount }, (_, index) => index + 1);
  }, [value]);
  const highlightedMarkup = useMemo(() => highlightJson(value), [value]);

  useEffect(() => {
    if (!autoGrow) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";

    const styles = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(styles.lineHeight) || 20;
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    const minHeight = lineHeight * rows + paddingTop + paddingBottom;

    textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
  }, [value, rows, autoGrow]);

  const syncScroll = (event) => {
    if (!lineNumbersRef.current) return;
    const { scrollTop, scrollLeft } = event.currentTarget;
    lineNumbersRef.current.scrollTop = scrollTop;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
  };

  return (
    <label>
      {label}
      <div className="jwt-json-textarea-shell">
        <div className="jwt-json-line-numbers" ref={lineNumbersRef} aria-hidden="true">
          {lineNumbers.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <div className="jwt-json-editor">
          <pre className={`jwt-json-highlight${showOverlay ? "" : " is-hidden"}`} ref={highlightRef} aria-hidden="true">
            <code dangerouslySetInnerHTML={{ __html: highlightedMarkup }} />
          </pre>
          <textarea
            ref={textareaRef}
            className={`jwt-json-textarea${showOverlay ? " is-overlay-mode" : ""}${autoGrow ? " is-auto-grow" : ""}`}
            rows={rows}
            value={value}
            onChange={onChange}
            onScroll={syncScroll}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            readOnly={readOnly}
            wrap="off"
            spellCheck={false}
          />
        </div>
      </div>
    </label>
  );
}

async function copyText(text, setMessage, successMessage, emptyMessage) {
  if (!text) {
    setMessage(emptyMessage);
    return;
  }
  if (!navigator.clipboard) {
    setMessage("Clipboard indisponivel neste navegador.");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setMessage(successMessage);
  } catch {
    setMessage("Nao foi possivel copiar.");
  }
}

export default function JwtToolPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [decodeHeader, setDecodeHeader] = useState("");
  const [decodePayload, setDecodePayload] = useState("");
  const [decodeSignature, setDecodeSignature] = useState("");
  const [decodeMessage, setDecodeMessage] = useState("");

  const [verifySecret, setVerifySecret] = useState(JWT_DEFAULT_SECRET);
  const [verifyMessage, setVerifyMessage] = useState("");

  const [generatorHeaderRaw, setGeneratorHeaderRaw] = useState(() => JSON.stringify(JWT_DEFAULT_HEADER, null, 2));
  const [generatorPayloadRaw, setGeneratorPayloadRaw] = useState(() => JSON.stringify(buildDefaultPayload(), null, 2));
  const [generatorSecret, setGeneratorSecret] = useState(JWT_DEFAULT_SECRET);
  const [generatedToken, setGeneratedToken] = useState("");
  const [generatorMessage, setGeneratorMessage] = useState("");

  const decodeToken = () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      setDecodeMessage("Informe um JWT para decodificar.");
      return;
    }

    const parts = trimmed.split(".");
    if (parts.length !== 3) {
      setDecodeMessage("JWT invalido. Formato esperado: header.payload.signature");
      return;
    }

    try {
      const [headerPart, payloadPart, signaturePart] = parts;
      const header = decodeJsonSegment(headerPart);
      const payload = decodeJsonSegment(payloadPart);
      const notes = getJwtValidationNotes(payload);

      setDecodeHeader(JSON.stringify(header, null, 2));
      setDecodePayload(JSON.stringify(payload, null, 2));
      setDecodeSignature(signaturePart);
      setDecodeMessage(notes.length > 0 ? `JWT decodificado. ${notes.join(" | ")}` : "JWT decodificado.");
    } catch (error) {
      setDecodeMessage(`Falha ao decodificar JWT: ${error.message}`);
    }
  };

  const verifySignature = async () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      setVerifyMessage("Informe um JWT para validar assinatura.");
      return;
    }
    if (!verifySecret.trim()) {
      setVerifyMessage("Informe o segredo (secret) para validar assinatura.");
      return;
    }

    try {
      const parts = trimmed.split(".");
      if (parts.length !== 3) {
        setVerifyMessage("JWT invalido.");
        return;
      }

      const header = decodeJsonSegment(parts[0]);
      if (header.alg !== "HS256") {
        setVerifyMessage(`Algoritmo ${header.alg || "desconhecido"} nao suportado neste modulo. Use HS256.`);
        return;
      }

      const valid = await verifyHs256(trimmed, verifySecret);
      setVerifyMessage(valid ? "Assinatura valida." : "Assinatura invalida.");
    } catch (error) {
      setVerifyMessage(`Erro ao validar assinatura: ${error.message}`);
    }
  };

  const generateToken = async () => {
    if (!generatorSecret.trim()) {
      setGeneratorMessage("Informe o segredo para gerar o JWT.");
      return;
    }

    const parsedHeader = parseJsonText(generatorHeaderRaw, "Header");
    if (!parsedHeader.ok) {
      setGeneratorMessage(parsedHeader.error);
      return;
    }

    const parsedPayload = parseJsonText(generatorPayloadRaw, "Payload");
    if (!parsedPayload.ok) {
      setGeneratorMessage(parsedPayload.error);
      return;
    }

    const header = parsedHeader.value || {};
    if (header.alg !== "HS256") {
      setGeneratorMessage("Geracao disponivel neste modulo apenas para HS256.");
      return;
    }

    try {
      const headerPart = encodeJsonSegment(header);
      const payloadPart = encodeJsonSegment(parsedPayload.value || {});
      const unsignedToken = `${headerPart}.${payloadPart}`;
      const signaturePart = await signHs256(unsignedToken, generatorSecret);
      const nextToken = `${unsignedToken}.${signaturePart}`;

      setGeneratedToken(nextToken);
      setGeneratorMessage("JWT HS256 gerado com sucesso.");
    } catch (error) {
      setGeneratorMessage(`Falha ao gerar JWT: ${error.message}`);
    }
  };

  return (
    <section className="card jwt-tool-page">
      <article className="jwt-block">
        <h2>Decodificar e validar JWT</h2>
        <label>
          JWT
          <textarea
            rows={6}
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            placeholder="Cole o token JWT (header.payload.signature)"
          />
        </label>

        <div className="jwt-actions">
          <button type="button" onClick={decodeToken}>
            Decodificar JWT
          </button>
          <button
            type="button"
            onClick={() =>
              copyText(tokenInput, setDecodeMessage, "JWT copiado.", "Nenhum JWT para copiar.")
            }
            disabled={!tokenInput.trim()}
          >
            Copiar JWT
          </button>
        </div>

        <div className="jwt-verify-row">
          <label>
            Secret (HS256)
            <input
              value={verifySecret}
              onChange={(event) => setVerifySecret(event.target.value)}
              placeholder="Informe o secret para verificar assinatura"
            />
          </label>
          <button type="button" onClick={verifySignature}>
            Validar assinatura
          </button>
        </div>

        {decodeMessage && <p className="jwt-message">{decodeMessage}</p>}
        {verifyMessage && <p className="jwt-message">{verifyMessage}</p>}

        <div className="jwt-output-grid">
          <JwtJsonEditor
            label="Header"
            value={decodeHeader}
            onChange={() => {}}
            placeholder="Header decodificado"
            rows={12}
            readOnly
            autoGrow
          />
          <JwtJsonEditor
            label="Payload"
            value={decodePayload}
            onChange={() => {}}
            placeholder="Payload decodificado"
            rows={12}
            readOnly
            autoGrow
          />
        </div>

        <label>
          Signature (Base64URL)
          <input readOnly value={decodeSignature} placeholder="Assinatura do token" />
        </label>
      </article>

      <article className="jwt-block">
        <h2>Gerar JWT HS256</h2>
        <JwtJsonEditor
          label="Header JSON"
          value={generatorHeaderRaw}
          onChange={(event) => setGeneratorHeaderRaw(event.target.value)}
          placeholder='{"alg":"HS256","typ":"JWT"}'
          rows={12}
        />

        <JwtJsonEditor
          label="Payload JSON"
          value={generatorPayloadRaw}
          onChange={(event) => setGeneratorPayloadRaw(event.target.value)}
          placeholder='{"sub":"qa-user"}'
          rows={14}
        />

        <label>
          Secret
          <input
            value={generatorSecret}
            onChange={(event) => setGeneratorSecret(event.target.value)}
            placeholder="Secret para assinatura HS256"
          />
        </label>

        <div className="jwt-actions">
          <button type="button" onClick={generateToken}>
            Gerar JWT
          </button>
          <button
            type="button"
            onClick={() =>
              copyText(generatedToken, setGeneratorMessage, "JWT gerado copiado.", "Nenhum JWT gerado para copiar.")
            }
            disabled={!generatedToken}
          >
            Copiar JWT gerado
          </button>
          <button
            type="button"
            onClick={() => {
              if (!generatedToken) {
                setGeneratorMessage("Gere um JWT primeiro.");
                return;
              }
              setTokenInput(generatedToken);
              setDecodeMessage("JWT gerado enviado para o validador.");
            }}
            disabled={!generatedToken}
          >
            Usar no validador
          </button>
        </div>

        {generatorMessage && <p className="jwt-message">{generatorMessage}</p>}

        <label>
          JWT gerado
          <textarea rows={8} readOnly value={generatedToken} placeholder="JWT gerado sera exibido aqui" />
        </label>
      </article>
    </section>
  );
}
