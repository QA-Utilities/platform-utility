import { useMemo, useRef, useState } from "react";
import { COMPARE_TYPES, HTML_VOID_TAGS } from "../config/presets/compareToolConfigs";
import "../styles/pages/compare-json-page.css";

function tryParseJson(value) {
  try {
    return { ok: true, data: JSON.parse(value) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function flattenObject(obj, prefix = "") {
  if (obj === null || typeof obj !== "object") {
    return [{ path: prefix || "root", value: obj }];
  }

  const entries = [];
  const iterable = Array.isArray(obj) ? obj.map((v, i) => [String(i), v]) : Object.entries(obj);

  iterable.forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") {
      entries.push(...flattenObject(value, path));
    } else {
      entries.push({ path, value });
    }
  });

  return entries;
}

function compareJson(leftContent, rightContent) {
  const left = tryParseJson(leftContent);
  const right = tryParseJson(rightContent);

  if (!left.ok || !right.ok) {
    return {
      error: `${!left.ok ? `JSON A invalido: ${left.error}` : ""}${!left.ok && !right.ok ? " | " : ""}${!right.ok ? `JSON B invalido: ${right.error}` : ""}`
    };
  }

  const leftFlat = new Map(flattenObject(left.data).map((item) => [item.path, item.value]));
  const rightFlat = new Map(flattenObject(right.data).map((item) => [item.path, item.value]));
  const allKeys = new Set([...leftFlat.keys(), ...rightFlat.keys()]);

  const diffs = [];
  allKeys.forEach((path) => {
    const inLeft = leftFlat.has(path);
    const inRight = rightFlat.has(path);

    if (!inLeft && inRight) {
      diffs.push({ type: "added", path, value: rightFlat.get(path) });
    } else if (inLeft && !inRight) {
      diffs.push({ type: "removed", path, value: leftFlat.get(path) });
    } else {
      const a = leftFlat.get(path);
      const b = rightFlat.get(path);
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        diffs.push({ type: "changed", path, left: a, right: b });
      }
    }
  });

  return { diffs: diffs.sort((a, b) => a.path.localeCompare(b.path)) };
}

function compareTextLike(leftContent, rightContent) {
  const leftLines = leftContent.replace(/\r\n/g, "\n").split("\n");
  const rightLines = rightContent.replace(/\r\n/g, "\n").split("\n");
  const maxLines = Math.max(leftLines.length, rightLines.length);
  const diffs = [];

  for (let index = 0; index < maxLines; index += 1) {
    const leftLine = leftLines[index];
    const rightLine = rightLines[index];
    const lineLabel = `linha ${index + 1}`;

    if (leftLine === rightLine) continue;

    if (leftLine === undefined) {
      diffs.push({ type: "added", path: lineLabel, value: rightLine });
      continue;
    }

    if (rightLine === undefined) {
      diffs.push({ type: "removed", path: lineLabel, value: leftLine });
      continue;
    }

    diffs.push({ type: "changed", path: lineLabel, left: leftLine, right: rightLine });
  }

  return { diffs };
}

function formatJsonContent(value) {
  if (!value.trim()) return { ok: true, data: value };
  const parsed = tryParseJson(value);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, data: JSON.stringify(parsed.data, null, 2) };
}

function formatHtmlContent(value) {
  if (!value.trim()) return value;

  const tokens = value.match(/<!--[\s\S]*?-->|<![^>]+>|<\/?[A-Za-z][^>]*>|[^<]+/g) || [];
  const voidTags = new Set(HTML_VOID_TAGS);

  let indentLevel = 0;
  const lines = [];

  tokens.forEach((rawToken) => {
    const token = rawToken.trim();
    if (!token) return;

    const isComment = /^<!--/.test(token);
    const isDeclaration = /^<![^-]/.test(token);
    const isClosingTag = /^<\//.test(token);
    const isTag = /^<[^>]+>$/.test(token) && !isComment && !isDeclaration;
    const tagNameMatch = token.match(/^<\/?\s*([A-Za-z0-9:-]+)/);
    const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : "";
    const isSelfClosing = /\/>$/.test(token);
    const isVoidTag = voidTags.has(tagName);
    const isOpeningTag = isTag && !isClosingTag && !isSelfClosing && !isVoidTag;

    if (isClosingTag) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    if (isTag || isComment || isDeclaration) {
      lines.push(`${"  ".repeat(indentLevel)}${token}`);
    } else {
      token.split(/\r?\n/).forEach((part) => {
        const cleanPart = part.trim();
        if (cleanPart) {
          lines.push(`${"  ".repeat(indentLevel)}${cleanPart}`);
        }
      });
    }

    if (isOpeningTag) {
      indentLevel += 1;
    }
  });

  return lines.join("\n");
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
      result += `<span class="${isKey ? "compare-token-json-key" : "compare-token-json-string"}">${escapeHtml(token)}</span>`;
    } else if (/^-?\d/.test(token)) {
      result += `<span class="compare-token-json-number">${escapeHtml(token)}</span>`;
    } else if (token === "true" || token === "false") {
      result += `<span class="compare-token-json-boolean">${token}</span>`;
    } else if (token === "null") {
      result += `<span class="compare-token-json-null">${token}</span>`;
    } else {
      result += `<span class="compare-token-json-punct">${escapeHtml(token)}</span>`;
    }

    lastIndex = start + token.length;
    match = tokenPattern.exec(source);
  }

  result += escapeHtml(source.slice(lastIndex));
  if (!source) return " ";
  return source.endsWith("\n") ? `${result}\n ` : result;
}

function highlightHtmlAttributes(source) {
  const attrPattern = /(\s+)([^\s=/>]+)(?:\s*=\s*(".*?"|'.*?'|[^\s"'>=]+))?/g;
  let result = "";
  let lastIndex = 0;
  let match = attrPattern.exec(source);

  while (match) {
    const [fullMatch, leadingSpaces, attrName, attrValue] = match;
    const start = match.index;

    result += escapeHtml(source.slice(lastIndex, start));
    result += escapeHtml(leadingSpaces);
    result += `<span class="compare-token-html-attr">${escapeHtml(attrName)}</span>`;

    if (typeof attrValue === "string") {
      const valueStartInsideMatch = fullMatch.lastIndexOf(attrValue);
      const between = fullMatch.slice(leadingSpaces.length + attrName.length, valueStartInsideMatch);
      result += `<span class="compare-token-html-bracket">${escapeHtml(between)}</span>`;
      result += `<span class="compare-token-html-value">${escapeHtml(attrValue)}</span>`;
    }

    lastIndex = start + fullMatch.length;
    match = attrPattern.exec(source);
  }

  result += escapeHtml(source.slice(lastIndex));
  return result;
}

function highlightHtml(source) {
  const tagPattern = /(<!--[\s\S]*?-->)|(<\/?)([A-Za-z][A-Za-z0-9:-]*)([^>]*?)(\/?>)/g;
  let result = "";
  let lastIndex = 0;
  let match = tagPattern.exec(source);

  while (match) {
    const [fullMatch, comment, openTag, tagName, attrs, closeTag] = match;
    const start = match.index;

    result += escapeHtml(source.slice(lastIndex, start));
    if (comment) {
      result += `<span class="compare-token-html-comment">${escapeHtml(comment)}</span>`;
    } else {
      result += `<span class="compare-token-html-bracket">${escapeHtml(openTag)}</span>`;
      result += `<span class="compare-token-html-tag">${escapeHtml(tagName)}</span>`;
      result += highlightHtmlAttributes(attrs || "");
      result += `<span class="compare-token-html-bracket">${escapeHtml(closeTag)}</span>`;
    }

    lastIndex = start + fullMatch.length;
    match = tagPattern.exec(source);
  }

  result += escapeHtml(source.slice(lastIndex));
  if (!source) return " ";
  return source.endsWith("\n") ? `${result}\n ` : result;
}

function getHighlightedMarkup(source, compareType) {
  if (compareType === "json") return highlightJson(source);
  if (compareType === "html") return highlightHtml(source);
  const escaped = escapeHtml(source);
  if (!source) return " ";
  return source.endsWith("\n") ? `${escaped}\n ` : escaped;
}

function formatDiffValue(value, compareType) {
  if (value === undefined) return "(vazio)";
  if (compareType === "json") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  if (value === null) return "null";
  return String(value);
}

function renderDiffCard(diff, compareType, index) {
  const typeLabel =
    diff.type === "changed" ? "Alterado" : diff.type === "added" ? "Adicionado" : "Removido";

  return (
    <article className={`compare-diff-card is-${diff.type}`} key={`${diff.path}-${index}`}>
      <header className="compare-diff-card-header">
        <span className={`compare-diff-chip is-${diff.type}`}>{typeLabel}</span>
        <code className="compare-diff-path">{diff.path}</code>
      </header>

      {diff.type === "changed" ? (
        <div className="compare-diff-compare">
          <div className="compare-diff-block">
            <small>A</small>
            <pre>{formatDiffValue(diff.left, compareType)}</pre>
          </div>
          <div className="compare-diff-block">
            <small>B</small>
            <pre>{formatDiffValue(diff.right, compareType)}</pre>
          </div>
        </div>
      ) : (
        <div className="compare-diff-block">
          <small>{diff.type === "added" ? "B" : "A"}</small>
          <pre>{formatDiffValue(diff.value, compareType)}</pre>
        </div>
      )}
    </article>
  );
}

function LineNumberedTextarea({ label, placeholder, value, onChange, compareType }) {
  const [isFocused, setIsFocused] = useState(false);
  const lineNumbersRef = useRef(null);
  const highlightRef = useRef(null);
  const hasSyntaxHighlight = compareType === "json" || compareType === "html";
  const showOverlay = hasSyntaxHighlight && !isFocused;
  const lineNumbers = useMemo(() => {
    const lineCount = Math.max(1, value.replace(/\r\n/g, "\n").split("\n").length);
    return Array.from({ length: lineCount }, (_, index) => index + 1);
  }, [value]);
  const highlightedMarkup = useMemo(() => getHighlightedMarkup(value, compareType), [value, compareType]);

  const syncLineScroll = (event) => {
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
      <div className="compare-json-textarea-shell">
        <div className="compare-json-line-numbers" ref={lineNumbersRef} aria-hidden="true">
          {lineNumbers.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <div className="compare-json-editor">
          <pre className={`compare-json-highlight${showOverlay ? "" : " is-hidden"}`} ref={highlightRef} aria-hidden="true">
            <code dangerouslySetInnerHTML={{ __html: highlightedMarkup }} />
          </pre>
          <textarea
            className={`compare-json-textarea${showOverlay ? " is-overlay-mode" : ""}`}
            placeholder={placeholder}
            rows={12}
            value={value}
            onChange={onChange}
            onScroll={syncLineScroll}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            wrap="off"
            spellCheck={false}
          />
        </div>
      </div>
    </label>
  );
}

export default function CompareJsonPage() {
  const [compareType, setCompareType] = useState("json");
  const [leftContent, setLeftContent] = useState("");
  const [rightContent, setRightContent] = useState("");
  const [formatFeedback, setFormatFeedback] = useState({ type: "", message: "" });
  const activeType = COMPARE_TYPES[compareType];
  const canFormat = compareType === "json" || compareType === "html";

  const compareResult = useMemo(() => {
    if (compareType === "json") {
      return compareJson(leftContent, rightContent);
    }
    return compareTextLike(leftContent, rightContent);
  }, [compareType, leftContent, rightContent]);
  const diffs = compareResult.diffs || [];
  const changedDiffs = diffs.filter((diff) => diff.type === "changed");
  const addedDiffs = diffs.filter((diff) => diff.type === "added");
  const removedDiffs = diffs.filter((diff) => diff.type === "removed");

  const formatInputs = () => {
    if (compareType === "json") {
      const left = formatJsonContent(leftContent);
      const right = formatJsonContent(rightContent);

      if (left.ok) setLeftContent(left.data);
      if (right.ok) setRightContent(right.data);

      const errors = [];
      if (!left.ok) errors.push(`JSON A invalido: ${left.error}`);
      if (!right.ok) errors.push(`JSON B invalido: ${right.error}`);

      if (errors.length > 0) {
        setFormatFeedback({ type: "error", message: errors.join(" | ") });
      } else {
        setFormatFeedback({ type: "success", message: "JSON A e B formatados." });
      }
      return;
    }

    if (compareType === "html") {
      setLeftContent((current) => formatHtmlContent(current));
      setRightContent((current) => formatHtmlContent(current));
      setFormatFeedback({ type: "success", message: "HTML A e B formatados." });
    }
  };

  const clearInputs = () => {
    setLeftContent("");
    setRightContent("");
    setFormatFeedback({ type: "", message: "" });
  };

  return (
    <section className="card compare-json-page">
      <div className="compare-json-toolbar">
        <label className="compare-json-type">
          Tipo de comparacao
          <select
            value={compareType}
            onChange={(event) => {
              setCompareType(event.target.value);
              setFormatFeedback({ type: "", message: "" });
            }}
          >
            {Object.entries(COMPARE_TYPES).map(([key, option]) => (
              <option key={key} value={key}>
                {key === "json" ? `${option.label} (principal)` : option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="compare-json-toolbar-actions">
          {canFormat && (
            <button type="button" className="compare-json-format-button" onClick={formatInputs}>
              Formatar {activeType.label}
            </button>
          )}
          <button type="button" className="compare-json-clear-button" onClick={clearInputs}>
            Limpar inputs
          </button>
        </div>
      </div>

      {formatFeedback.message && (
        <p className={`compare-json-format-feedback is-${formatFeedback.type}`}>{formatFeedback.message}</p>
      )}

      <LineNumberedTextarea
        label={`${activeType.label} A`}
        placeholder={activeType.placeholder}
        value={leftContent}
        onChange={(event) => setLeftContent(event.target.value)}
        compareType={compareType}
      />

      <LineNumberedTextarea
        label={`${activeType.label} B`}
        placeholder={activeType.placeholder}
        value={rightContent}
        onChange={(event) => setRightContent(event.target.value)}
        compareType={compareType}
      />

      <div className="compare-json-diff">
        <div className="compare-json-diff-header">
          <h2>Diferencas</h2>
          {!compareResult.error && diffs.length > 0 && (
            <div className="compare-json-summary">
              <span className="compare-summary-pill is-changed">Alterados: {changedDiffs.length}</span>
              <span className="compare-summary-pill is-added">Adicionados: {addedDiffs.length}</span>
              <span className="compare-summary-pill is-removed">Removidos: {removedDiffs.length}</span>
            </div>
          )}
        </div>
        {compareResult.error && <p className="compare-json-error">{compareResult.error}</p>}
        {!compareResult.error && diffs.length === 0 && (
          <p className="compare-json-success">Sem diferencas</p>
        )}
        {!compareResult.error && diffs.length > 0 && (
          <div className="compare-json-groups">
            {changedDiffs.length > 0 && (
              <section className="compare-json-group">
                <h3>Alterados</h3>
                <div className="compare-diff-list">{changedDiffs.map((diff, index) => renderDiffCard(diff, compareType, index))}</div>
              </section>
            )}

            {addedDiffs.length > 0 && (
              <section className="compare-json-group">
                <h3>Adicionados</h3>
                <div className="compare-diff-list">{addedDiffs.map((diff, index) => renderDiffCard(diff, compareType, index))}</div>
              </section>
            )}

            {removedDiffs.length > 0 && (
              <section className="compare-json-group">
                <h3>Removidos</h3>
                <div className="compare-diff-list">{removedDiffs.map((diff, index) => renderDiffCard(diff, compareType, index))}</div>
              </section>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
