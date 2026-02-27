import { useState } from "react";
import {
  MOCK_DEFAULT_INPUT,
  MOCK_KEY_HINTS,
  MOCK_RANDOM_DATA,
  MOCK_TOKEN_HINTS
} from "../config/presets/mockApiConfigs";
import "../styles/pages/mock-api-page.css";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(list) {
  return list[randomInt(0, list.length - 1)];
}

function randomDigits(length) {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += String(randomInt(0, 9));
  }
  return value;
}

function randomAlphaNum(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += chars[randomInt(0, chars.length - 1)];
  }
  return value;
}

function buildUuidFallback() {
  const chars = "abcdef0123456789";
  let value = "";
  for (let i = 0; i < 32; i += 1) {
    value += chars[randomInt(0, chars.length - 1)];
  }
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function buildName() {
  return `${randomItem(MOCK_RANDOM_DATA.firstNames)} ${randomItem(MOCK_RANDOM_DATA.lastNames)}`;
}

function buildEmail() {
  const first = randomItem(MOCK_RANDOM_DATA.firstNames).toLowerCase();
  const last = randomItem(MOCK_RANDOM_DATA.lastNames).toLowerCase();
  const domain = randomItem(MOCK_RANDOM_DATA.domains);
  return `${first}.${last}${randomInt(10, 99)}@${domain}`;
}

function buildSentence() {
  const size = randomInt(6, 11);
  const words = Array.from({ length: size }, () => randomItem(MOCK_RANDOM_DATA.words));
  return `${words.join(" ")}.`;
}

function buildPhone() {
  return `+55 (${randomInt(11, 99)}) 9${randomDigits(4)}-${randomDigits(4)}`;
}

function buildZipcode() {
  return `${randomDigits(5)}-${randomDigits(3)}`;
}

function buildUrl() {
  return `https://api.${randomItem(MOCK_RANDOM_DATA.domains)}/${randomItem(MOCK_RANDOM_DATA.words)}/${randomInt(100, 999)}`;
}

function resolveToken(tokenName) {
  const token = (tokenName || "").toLowerCase().trim();

  if (/^number:-?\d+:-?\d+$/.test(token)) {
    const [, minRaw, maxRaw] = token.split(":");
    const min = Number(minRaw);
    const max = Number(maxRaw);
    return randomInt(Math.min(min, max), Math.max(min, max));
  }

  if (token === "id") return randomInt(1, 999999);
  if (token === "uuid") return window.crypto?.randomUUID?.() || buildUuidFallback();
  if (token === "name") return buildName();
  if (token === "email") return buildEmail();
  if (token === "boolean") return Math.random() >= 0.5;
  if (token === "date") return new Date(Date.now() - randomInt(0, 31_536_000) * 1000).toISOString();
  if (token === "word") return randomItem(MOCK_RANDOM_DATA.words);
  if (token === "sentence") return buildSentence();
  if (token === "city") return randomItem(MOCK_RANDOM_DATA.cities);
  if (token === "state") return randomItem(MOCK_RANDOM_DATA.states);
  if (token === "country") return randomItem(MOCK_RANDOM_DATA.countries);
  if (token === "phone") return buildPhone();
  if (token === "company") return `${randomItem(MOCK_RANDOM_DATA.companies)} ${randomItem(["Tech", "Labs", "Solutions", "Group"])}`;
  if (token === "status") return randomItem(MOCK_RANDOM_DATA.statuses);

  return `mock-${token}`;
}

function inferByKey(key, fallbackType = "string") {
  const safeKey = String(key || "").toLowerCase();

  if (safeKey.includes("uuid")) return window.crypto?.randomUUID?.() || buildUuidFallback();
  if (safeKey.includes("email")) return buildEmail();
  if (safeKey.includes("firstname") || safeKey.includes("first_name")) return randomItem(MOCK_RANDOM_DATA.firstNames);
  if (safeKey.includes("lastname") || safeKey.includes("last_name")) return randomItem(MOCK_RANDOM_DATA.lastNames);
  if (safeKey.includes("name") || safeKey.includes("nome")) return buildName();
  if (safeKey.includes("phone") || safeKey.includes("telefone") || safeKey.includes("mobile") || safeKey.includes("cel")) return buildPhone();
  if (safeKey.includes("city") || safeKey.includes("cidade")) return randomItem(MOCK_RANDOM_DATA.cities);
  if (safeKey.includes("state") || safeKey.includes("estado") || safeKey.includes("province")) return randomItem(MOCK_RANDOM_DATA.states);
  if (safeKey.includes("country") || safeKey.includes("pais")) return randomItem(MOCK_RANDOM_DATA.countries);
  if (safeKey.includes("status")) return randomItem(MOCK_RANDOM_DATA.statuses);
  if (safeKey.includes("company") || safeKey.includes("empresa")) return `${randomItem(MOCK_RANDOM_DATA.companies)} ${randomItem(["Tech", "Labs", "Solutions", "Group"])}`;
  if (safeKey.includes("street") || safeKey.includes("address") || safeKey.includes("endereco")) return `${randomItem(MOCK_RANDOM_DATA.streets)}, ${randomInt(10, 9999)}`;
  if (safeKey.includes("zip") || safeKey.includes("cep") || safeKey.includes("postal")) return buildZipcode();
  if (safeKey.includes("url") || safeKey.includes("link") || safeKey.includes("site")) return buildUrl();
  if (safeKey.includes("token")) return randomAlphaNum(24);
  if (safeKey.includes("password") || safeKey.includes("senha")) return `${randomAlphaNum(8)}!${randomInt(10, 99)}`;
  if (safeKey.includes("date") || safeKey.includes("time") || safeKey.endsWith("at")) return new Date().toISOString();
  if (safeKey.includes("price") || safeKey.includes("amount") || safeKey.includes("total") || safeKey.includes("valor")) {
    return Number((randomInt(1000, 250000) / 100).toFixed(2));
  }
  if (safeKey.includes("id")) return randomInt(1, 999999);

  if (fallbackType === "number") return randomInt(1, 9999);
  if (fallbackType === "boolean") return Math.random() >= 0.5;
  return randomItem(MOCK_RANDOM_DATA.words);
}

function shouldFillValue(value, overwriteExisting) {
  if (overwriteExisting) return true;
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "" || /{{\s*[^{}]+\s*}}/.test(value);
  if (typeof value === "number") return value === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function replaceTokensInString(value) {
  const trimmed = value.trim();
  const fullToken = trimmed.match(/^{{\s*([^{}]+)\s*}}$/);
  if (fullToken) {
    return resolveToken(fullToken[1]);
  }

  return value.replace(/{{\s*([^{}]+)\s*}}/g, (_, tokenName) => String(resolveToken(tokenName)));
}

function populateValue(value, keyPath, overwriteExisting) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      const keyName = keyPath.split(".").pop() || "item";
      const singularKey = keyName.endsWith("s") ? keyName.slice(0, -1) : keyName;
      return [inferByKey(singularKey, "string")];
    }
    return value.map((item, index) => populateValue(item, `${keyPath}[${index}]`, overwriteExisting));
  }

  if (value !== null && typeof value === "object") {
    const result = {};
    Object.entries(value).forEach(([key, nested]) => {
      const path = keyPath ? `${keyPath}.${key}` : key;
      result[key] = populateValue(nested, path, overwriteExisting);
    });
    return result;
  }

  const key = keyPath.split(".").pop() || keyPath;

  if (typeof value === "string") {
    if (/{{\s*[^{}]+\s*}}/.test(value)) {
      return replaceTokensInString(value);
    }

    if (shouldFillValue(value, overwriteExisting)) {
      return inferByKey(key, "string");
    }
    return value;
  }

  if (typeof value === "number") {
    if (shouldFillValue(value, overwriteExisting)) {
      return inferByKey(key, "number");
    }
    return value;
  }

  if (typeof value === "boolean") {
    if (overwriteExisting) {
      return inferByKey(key, "boolean");
    }
    return value;
  }

  if (value === null || value === undefined) {
    return inferByKey(key, "string");
  }

  return value;
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

export default function MockApiPage() {
  const [inputJsonRaw, setInputJsonRaw] = useState(() => JSON.stringify(MOCK_DEFAULT_INPUT, null, 2));
  const [outputJsonRaw, setOutputJsonRaw] = useState("");
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const populateJson = () => {
    let parsed;
    try {
      parsed = JSON.parse(inputJsonRaw);
    } catch (error) {
      setStatusMessage(`JSON de entrada invalido: ${error.message}`);
      return;
    }

    const populated = populateValue(parsed, "", overwriteExisting);
    setOutputJsonRaw(JSON.stringify(populated, null, 2));
    setStatusMessage("JSON populado com dados mock.");
  };

  const clearAll = () => {
    setInputJsonRaw("");
    setOutputJsonRaw("");
    setStatusMessage("Campos limpos.");
  };

  const useOutputAsInput = () => {
    if (!outputJsonRaw) {
      setStatusMessage("Gere um JSON mock primeiro.");
      return;
    }
    setInputJsonRaw(outputJsonRaw);
    setStatusMessage("Resultado enviado para entrada.");
  };

  return (
    <section className="card mock-api-page">
      <article className="mock-api-block">
        <h2>Popular JSON com mock</h2>
        <p className="mock-api-caption">
          Cole um JSON e clique em mock para preencher automaticamente os valores.
        </p>

        <label>
          JSON de entrada
          <textarea
            rows={16}
            value={inputJsonRaw}
            onChange={(event) => setInputJsonRaw(event.target.value)}
            placeholder='{"name":"","email":"","amount":0}'
          />
        </label>

        <label className="mock-api-checkbox">
          <input
            type="checkbox"
            checked={overwriteExisting}
            onChange={(event) => setOverwriteExisting(event.target.checked)}
          />
          Sobrescrever valores ja preenchidos
        </label>

        <p className="mock-api-caption">Chaves reconhecidas automaticamente:</p>
        <div className="mock-api-hints">
          {MOCK_KEY_HINTS.map((item) => (
            <code key={item}>{item}</code>
          ))}
        </div>

        <p className="mock-api-caption">Tokens opcionais no valor string:</p>
        <div className="mock-api-hints">
          {MOCK_TOKEN_HINTS.map((token) => (
            <code key={token}>{token}</code>
          ))}
        </div>

        <div className="mock-api-actions">
          <button type="button" onClick={populateJson}>
            Mockar JSON
          </button>
          <button type="button" onClick={useOutputAsInput} disabled={!outputJsonRaw}>
            Usar resultado na entrada
          </button>
          <button type="button" onClick={clearAll}>
            Limpar tudo
          </button>
        </div>

        {statusMessage && <p className="mock-api-message">{statusMessage}</p>}
      </article>

      <article className="mock-api-block">
        <div className="mock-api-output">
          <div className="mock-api-output-header">
            <strong>JSON populado</strong>
            <button
              type="button"
              onClick={() =>
                copyText(outputJsonRaw, setStatusMessage, "JSON populado copiado.", "Nenhum JSON para copiar.")
              }
              disabled={!outputJsonRaw}
            >
              Copiar JSON
            </button>
          </div>
          <textarea rows={24} readOnly value={outputJsonRaw} placeholder="Resultado mock sera exibido aqui" />
        </div>
      </article>
    </section>
  );
}
