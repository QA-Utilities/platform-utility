import { useMemo, useRef, useState } from "react";
import { JSON_TOOL_DEFAULT_PAIRS, JSON_TOOL_DEFAULT_RAW } from "../config/presets/jsonToolConfigs";
import "../styles/pages/json-tool-page.css";

function tryParseJson(value) {
  try {
    return { ok: true, data: JSON.parse(value) };
  } catch (error) {
    return { ok: false, error: error.message };
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
      result += `<span class="${isKey ? "json-token-key" : "json-token-string"}">${escapeHtml(token)}</span>`;
    } else if (/^-?\d/.test(token)) {
      result += `<span class="json-token-number">${escapeHtml(token)}</span>`;
    } else if (token === "true" || token === "false") {
      result += `<span class="json-token-boolean">${token}</span>`;
    } else if (token === "null") {
      result += `<span class="json-token-null">${token}</span>`;
    } else {
      result += `<span class="json-token-punct">${escapeHtml(token)}</span>`;
    }

    lastIndex = start + token.length;
    match = tokenPattern.exec(source);
  }

  result += escapeHtml(source.slice(lastIndex));
  if (!source) return " ";
  return source.endsWith("\n") ? `${result}\n ` : result;
}

function JsonLineNumberedTextarea({ value, onChange = () => {}, placeholder, rows = 8, readOnly = false, ariaLabel }) {
  const [isFocused, setIsFocused] = useState(false);
  const lineNumbersRef = useRef(null);
  const highlightRef = useRef(null);
  const lineNumbers = useMemo(() => {
    const lineCount = Math.max(1, value.replace(/\r\n/g, "\n").split("\n").length);
    return Array.from({ length: lineCount }, (_, index) => index + 1);
  }, [value]);
  const highlightedMarkup = useMemo(() => highlightJson(value), [value]);
  const showOverlay = readOnly || !isFocused;

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
    <div className="json-tool-textarea-shell">
      <div className="json-tool-line-numbers" ref={lineNumbersRef} aria-hidden="true">
        {lineNumbers.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
      <div className="json-tool-editor">
        <pre className={`json-tool-highlight${showOverlay ? "" : " is-hidden"}`} ref={highlightRef} aria-hidden="true">
          <code dangerouslySetInnerHTML={{ __html: highlightedMarkup }} />
        </pre>
        <textarea
          className={`json-tool-textarea${showOverlay ? " is-overlay-mode" : ""}`}
          rows={rows}
          value={value}
          onChange={onChange}
          onScroll={syncScroll}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          readOnly={readOnly}
          aria-label={ariaLabel}
          wrap="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

export default function JsonToolPage() {
  const [pairs, setPairs] = useState(JSON_TOOL_DEFAULT_PAIRS);
  const [jsonRaw, setJsonRaw] = useState(JSON_TOOL_DEFAULT_RAW);
  const [jsonOutput, setJsonOutput] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const addPair = () => setPairs((current) => [...current, { key: "", value: "" }]);

  const updatePair = (index, field, value) => {
    setPairs((current) =>
      current.map((pair, i) => {
        if (i !== index) return pair;
        return { ...pair, [field]: value };
      })
    );
  };

  const removePair = (index) => {
    setPairs((current) => current.filter((_, i) => i !== index));
  };

  const generateFromPairs = () => {
    const obj = {};
    let duplicateCount = 0;

    pairs.forEach((pair) => {
      const key = pair.key.trim();
      if (!key) return;

      if (!(key in obj)) {
        obj[key] = pair.value;
        return;
      }

      duplicateCount += 1;
      if (Array.isArray(obj[key])) {
        obj[key].push(pair.value);
        return;
      }

      obj[key] = [obj[key], pair.value];
    });

    setJsonOutput(JSON.stringify(obj, null, 2));
    if (duplicateCount > 0) {
      setStatusMessage(`JSON gerado. ${duplicateCount} chave(s) repetida(s) foram agrupadas em array.`);
      return;
    }
    setStatusMessage("JSON gerado com sucesso.");
  };

  const formatRawJson = () => {
    const parsed = tryParseJson(jsonRaw);
    if (!parsed.ok) {
      setJsonOutput(`Erro: ${parsed.error}`);
      setStatusMessage("Falha ao formatar JSON.");
      return;
    }
    setJsonOutput(JSON.stringify(parsed.data, null, 2));
    setStatusMessage("JSON formatado com sucesso.");
  };

  const copyJsonOutput = async () => {
    if (!jsonOutput) {
      setStatusMessage("Nenhum resultado JSON para copiar.");
      return;
    }

    if (!navigator.clipboard) {
      setStatusMessage("Clipboard indisponivel neste navegador.");
      return;
    }

    try {
      await navigator.clipboard.writeText(jsonOutput);
      setStatusMessage("Resultado JSON copiado.");
    } catch {
      setStatusMessage("Nao foi possivel copiar o JSON.");
    }
  };

  return (
    <section className="card json-tool-page">
      <div>
        <h2>Gerar JSON por campos</h2>
        {pairs.map((pair, index) => (
          <div className="json-tool-row" key={index}>
            <input
              placeholder="Chave"
              value={pair.key}
              onChange={(e) => updatePair(index, "key", e.target.value)}
            />
            <input
              placeholder="Valor"
              value={pair.value}
              onChange={(e) => updatePair(index, "value", e.target.value)}
            />
            <button type="button" onClick={() => removePair(index)}>
              Remover
            </button>
          </div>
        ))}
        <div className="json-tool-actions">
          <button type="button" onClick={addPair}>
            Adicionar campo
          </button>
          <button type="button" onClick={generateFromPairs}>
            Gerar JSON
          </button>
        </div>
      </div>

      <div>
        <h2>Validar e formatar JSON</h2>
        <JsonLineNumberedTextarea
          value={jsonRaw}
          onChange={(event) => setJsonRaw(event.target.value)}
          placeholder="Cole o JSON aqui"
          rows={8}
          ariaLabel="Entrada JSON"
        />
        <button type="button" className="json-tool-format-button" onClick={formatRawJson}>
          Formatar JSON
        </button>
      </div>

      <div className="json-tool-output">
        <div className="json-tool-output-header">
          <span>Resultado JSON</span>
          <button type="button" onClick={copyJsonOutput} disabled={!jsonOutput}>
            Copiar JSON
          </button>
        </div>
        <JsonLineNumberedTextarea
          placeholder="O resultado da acao saira aqui"
          rows={12}
          value={jsonOutput}
          readOnly
          ariaLabel="Resultado JSON"
        />
      </div>

      {statusMessage && <p className="json-tool-message">{statusMessage}</p>}
    </section>
  );
}
