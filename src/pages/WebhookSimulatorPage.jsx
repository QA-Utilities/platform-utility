import { useState } from "react";
import {
  WEBHOOK_ALGORITHMS,
  WEBHOOK_DEFAULT_PAYLOAD,
  WEBHOOK_DEFAULTS,
  WEBHOOK_HTTP_METHODS,
  WEBHOOK_PROVIDERS
} from "../config/presets/webhookSimulatorConfigs";
import "../styles/pages/webhook-simulator-page.css";

function nowTimestampSeconds() {
  return Math.floor(Date.now() / 1000);
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function algoPrefix(algorithm) {
  return algorithm.toLowerCase().replace("-", "");
}

function escapeForSingleQuotes(value) {
  return String(value).replace(/'/g, "'\"'\"'");
}

function escapeDoubleQuotes(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function hmacHex(value, secret, algorithm) {
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

  const signature = await window.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(signature));
}

function buildHeaders(provider, eventType, timestamp, signature, algorithm) {
  const base = {
    "Content-Type": "application/json"
  };
  const signaturePrefix = algoPrefix(algorithm);

  if (provider === "stripe") {
    return {
      ...base,
      "Stripe-Event-Type": eventType,
      "Stripe-Signature": `t=${timestamp},v1=${signature}`
    };
  }

  if (provider === "github") {
    const usesSha1 = algorithm === "SHA-1";
    const headerName = usesSha1 ? "X-Hub-Signature" : "X-Hub-Signature-256";
    return {
      ...base,
      "User-Agent": "QA-Webhook-Simulator",
      "X-GitHub-Event": eventType,
      "X-GitHub-Delivery": window.crypto?.randomUUID?.() || `delivery-${timestamp}`,
      [headerName]: `${signaturePrefix}=${signature}`
    };
  }

  return {
    ...base,
    "X-Webhook-Event": eventType,
    "X-Webhook-Timestamp": String(timestamp),
    "X-Webhook-Signature": `${signaturePrefix}=${signature}`
  };
}

function buildCurlCommand(method, endpoint, headers, payloadRaw) {
  const headerFlags = Object.entries(headers)
    .map(([key, value]) => `-H "${escapeDoubleQuotes(`${key}: ${value}`)}"`)
    .join(" \\\n  ");

  return [
    `curl -X ${method} "${escapeDoubleQuotes(endpoint)}" \\`,
    `  ${headerFlags} \\`,
    `  -d '${escapeForSingleQuotes(payloadRaw)}'`
  ].join("\n");
}

function parsePayloadOrThrow(payloadRaw) {
  try {
    const parsed = JSON.parse(payloadRaw);
    return {
      parsed,
      pretty: JSON.stringify(parsed, null, 2),
      compact: JSON.stringify(parsed)
    };
  } catch (error) {
    throw new Error(`Payload JSON invalido: ${error.message}`);
  }
}

async function buildWebhookInfo({
  provider,
  method,
  endpoint,
  eventType,
  algorithm,
  secret,
  timestamp,
  payloadRaw,
  providerLabel
}) {
  const safeTimestamp = Number(timestamp) || nowTimestampSeconds();
  const { pretty, compact } = parsePayloadOrThrow(payloadRaw);
  const valueToSign = provider === "stripe" ? `${safeTimestamp}.${compact}` : compact;
  const signature = await hmacHex(valueToSign, secret, algorithm);
  const headers = buildHeaders(provider, eventType || "event.default", safeTimestamp, signature, algorithm);
  const curlCommand = buildCurlCommand(method, endpoint, headers, compact);
  const createdAt = new Date().toISOString();

  return {
    prettyPayload: pretty,
    compactPayload: compact,
    headers,
    signature: {
      provider,
      algorithm,
      timestamp: safeTimestamp,
      signedPayload: valueToSign,
      signature
    },
    summary: {
      method,
      endpoint,
      eventType,
      providerLabel,
      payloadSize: compact.length,
      createdAt
    },
    curlCommand
  };
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

export default function WebhookSimulatorPage() {
  const [provider, setProvider] = useState(WEBHOOK_DEFAULTS.provider);
  const [method, setMethod] = useState(WEBHOOK_DEFAULTS.method);
  const [endpoint, setEndpoint] = useState(WEBHOOK_DEFAULTS.endpoint);
  const [eventType, setEventType] = useState(WEBHOOK_DEFAULTS.eventType);
  const [secret, setSecret] = useState(WEBHOOK_DEFAULTS.secret);
  const [algorithm, setAlgorithm] = useState(WEBHOOK_DEFAULTS.algorithm);
  const [timestamp, setTimestamp] = useState(String(nowTimestampSeconds()));
  const [payloadRaw, setPayloadRaw] = useState(() => JSON.stringify(WEBHOOK_DEFAULT_PAYLOAD, null, 2));

  const [headersRaw, setHeadersRaw] = useState("");
  const [signatureRaw, setSignatureRaw] = useState("");
  const [curlRaw, setCurlRaw] = useState("");
  const [requestSummaryRaw, setRequestSummaryRaw] = useState("");
  const [responseRaw, setResponseRaw] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const selectedProvider = WEBHOOK_PROVIDERS.find((item) => item.value === provider) || WEBHOOK_PROVIDERS[0];

  const buildCorsHint = () => {
    try {
      const endpointHost = new URL(endpoint).hostname.toLowerCase();
      if (endpointHost.includes("webhook.site")) {
        return "No webhook.site, abra o webhook > Edit > marque 'Add CORS headers' > Save. Depois tente novamente.";
      }
    } catch {
      // Keep generic hint for invalid URL parse cases.
    }

    return "Se o endpoint bloquear CORS no navegador, a request pode falhar. Verifique se o endpoint permite OPTIONS e os headers enviados.";
  };

  const formatPayload = () => {
    try {
      const { pretty } = parsePayloadOrThrow(payloadRaw);
      setPayloadRaw(pretty);
      setStatusMessage("Payload formatado com sucesso.");
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const applyGeneratedInfo = (generatedInfo) => {
    setPayloadRaw(generatedInfo.prettyPayload);
    setHeadersRaw(JSON.stringify(generatedInfo.headers, null, 2));
    setSignatureRaw(JSON.stringify(generatedInfo.signature, null, 2));
    setRequestSummaryRaw(JSON.stringify(generatedInfo.summary, null, 2));
    setCurlRaw(generatedInfo.curlCommand);
  };

  const generateInfo = async () => {
    if (!endpoint.trim()) {
      setStatusMessage("Informe o endpoint para gerar informacoes.");
      return;
    }
    if (!secret.trim()) {
      setStatusMessage("Informe o secret para gerar assinatura.");
      return;
    }

    try {
      const generatedInfo = await buildWebhookInfo({
        provider,
        method,
        endpoint,
        eventType,
        algorithm,
        secret,
        timestamp,
        payloadRaw,
        providerLabel: selectedProvider.label
      });
      applyGeneratedInfo(generatedInfo);
      setStatusMessage("Informacoes geradas com sucesso.");
    } catch (error) {
      setStatusMessage(`Falha ao gerar informacoes: ${error.message}`);
    }
  };

  const simulateWebhook = async () => {
    if (!endpoint.trim()) {
      setStatusMessage("Informe o endpoint para simular webhook.");
      return;
    }
    if (!secret.trim()) {
      setStatusMessage("Informe o secret para simular webhook.");
      return;
    }

    try {
      const generatedInfo = await buildWebhookInfo({
        provider,
        method,
        endpoint,
        eventType,
        algorithm,
        secret,
        timestamp,
        payloadRaw,
        providerLabel: selectedProvider.label
      });

      const requestStartedAt = new Date().toISOString();
      const response = await fetch(endpoint, {
        method,
        headers: generatedInfo.headers,
        body: generatedInfo.compactPayload
      });

      const responseText = await response.text();
      let responseBody = responseText;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        // Keep plain text when response is not JSON.
      }

      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      setResponseRaw(
        JSON.stringify(
          {
            requestedAt: requestStartedAt,
            endpoint,
            method,
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body: responseBody
          },
          null,
          2
        )
      );
      setStatusMessage("Webhook enviado e resposta recebida. Informacoes geradas nao foram alteradas.");
    } catch (error) {
      setResponseRaw(
        JSON.stringify(
          {
            error: error.message,
            hint: buildCorsHint()
          },
          null,
          2
        )
      );
      setStatusMessage(`Falha ao simular webhook: ${error.message}`);
    }
  };

  const clearOutputs = () => {
    setHeadersRaw("");
    setSignatureRaw("");
    setCurlRaw("");
    setRequestSummaryRaw("");
    setResponseRaw("");
    setStatusMessage("Saidas limpas.");
  };

  return (
    <section className="card webhook-simulator-page">
      <article className="webhook-simulator-block">
        <h2>Webhook Simulator</h2>
        <p className="webhook-simulator-caption">
          Simule eventos webhook com assinatura HMAC, headers e comando cURL.
        </p>

        <div className="webhook-simulator-grid">
          <label>
            Provedor
            <select value={provider} onChange={(event) => setProvider(event.target.value)}>
              {WEBHOOK_PROVIDERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Metodo HTTP
            <select value={method} onChange={(event) => setMethod(event.target.value)}>
              {WEBHOOK_HTTP_METHODS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Endpoint
            <input
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              placeholder="https://example.com/webhook"
            />
          </label>

          <label>
            Tipo do evento
            <input
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
              placeholder="payment.succeeded"
            />
          </label>

          <label>
            Algoritmo
            <select value={algorithm} onChange={(event) => setAlgorithm(event.target.value)}>
              {WEBHOOK_ALGORITHMS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Timestamp (segundos)
            <div className="webhook-simulator-inline">
              <input
                value={timestamp}
                onChange={(event) => setTimestamp(event.target.value)}
                placeholder="1700000000"
              />
              <button type="button" onClick={() => setTimestamp(String(nowTimestampSeconds()))}>
                Agora
              </button>
            </div>
          </label>
        </div>

        <label>
          Secret
          <input
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="webhook-secret"
          />
        </label>

        <label>
          Payload JSON
          <textarea
            rows={12}
            value={payloadRaw}
            onChange={(event) => setPayloadRaw(event.target.value)}
            placeholder='{"id":"evt_1","type":"payment.succeeded"}'
          />
        </label>

        <p className="webhook-simulator-provider-note">{selectedProvider.description}</p>

        <div className="webhook-simulator-actions">
          <button type="button" onClick={generateInfo}>
            Gerar informacoes
          </button>
          <button type="button" onClick={simulateWebhook}>
            Simular webhook
          </button>
          <button type="button" onClick={formatPayload}>
            Formatar payload
          </button>
          <button type="button" onClick={clearOutputs}>
            Limpar saidas
          </button>
        </div>

        {statusMessage && <p className="webhook-simulator-message">{statusMessage}</p>}
      </article>

      <article className="webhook-simulator-block">
        <div className="webhook-simulator-output">
          <div className="webhook-simulator-output-header">
            <strong>Resposta da request</strong>
            <button
              type="button"
              onClick={() =>
                copyText(responseRaw, setStatusMessage, "Resposta copiada.", "Nenhuma resposta para copiar.")
              }
              disabled={!responseRaw}
            >
              Copiar
            </button>
          </div>
          <textarea rows={10} readOnly value={responseRaw} placeholder="Resposta da request sera exibida aqui" />
        </div>

        <div className="webhook-simulator-output">
          <div className="webhook-simulator-output-header">
            <strong>Headers gerados</strong>
            <button
              type="button"
              onClick={() =>
                copyText(headersRaw, setStatusMessage, "Headers copiados.", "Nenhum header para copiar.")
              }
              disabled={!headersRaw}
            >
              Copiar
            </button>
          </div>
          <textarea rows={8} readOnly value={headersRaw} placeholder="Headers serao exibidos aqui" />
        </div>

        <div className="webhook-simulator-output">
          <div className="webhook-simulator-output-header">
            <strong>Assinatura</strong>
            <button
              type="button"
              onClick={() =>
                copyText(signatureRaw, setStatusMessage, "Assinatura copiada.", "Nenhuma assinatura para copiar.")
              }
              disabled={!signatureRaw}
            >
              Copiar
            </button>
          </div>
          <textarea rows={8} readOnly value={signatureRaw} placeholder="Assinatura sera exibida aqui" />
        </div>

        <div className="webhook-simulator-output">
          <div className="webhook-simulator-output-header">
            <strong>Comando cURL</strong>
            <button
              type="button"
              onClick={() =>
                copyText(curlRaw, setStatusMessage, "Comando cURL copiado.", "Nenhum comando cURL para copiar.")
              }
              disabled={!curlRaw}
            >
              Copiar
            </button>
          </div>
          <textarea rows={11} readOnly value={curlRaw} placeholder="Comando cURL sera exibido aqui" />
        </div>

        <div className="webhook-simulator-output">
          <div className="webhook-simulator-output-header">
            <strong>Resumo da simulacao</strong>
            <button
              type="button"
              onClick={() =>
                copyText(
                  requestSummaryRaw,
                  setStatusMessage,
                  "Resumo da simulacao copiado.",
                  "Nenhum resumo para copiar."
                )
              }
              disabled={!requestSummaryRaw}
            >
              Copiar
            </button>
          </div>
          <textarea rows={6} readOnly value={requestSummaryRaw} placeholder="Resumo sera exibido aqui" />
        </div>
      </article>
    </section>
  );
}
