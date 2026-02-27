import { useMemo, useState } from "react";
import {
  SECURITY_PAYLOAD_CATEGORIES,
  SECURITY_TYPE_OPTIONS
} from "../config/presets/securityPayloadConfigs";
import "../styles/pages/security-payloads-page.css";

function normalize(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildPayloadList(selectedType) {
  if (selectedType === "all") {
    return Object.entries(SECURITY_PAYLOAD_CATEGORIES).flatMap(([typeKey, category]) =>
      category.payloads.map((payload) => ({
        type: typeKey,
        typeLabel: category.label,
        payload
      }))
    );
  }

  const category = SECURITY_PAYLOAD_CATEGORIES[selectedType];
  if (!category) return [];
  return category.payloads.map((payload) => ({
    type: selectedType,
    typeLabel: category.label,
    payload
  }));
}

function downloadText(content, filename) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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

export default function SecurityPayloadsPage() {
  const [selectedType, setSelectedType] = useState("all");
  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const basePayloads = useMemo(() => buildPayloadList(selectedType), [selectedType]);
  const normalizedSearch = useMemo(() => normalize(search.trim()), [search]);
  const filteredPayloads = useMemo(() => {
    if (!normalizedSearch) return basePayloads;
    return basePayloads.filter((item) => normalize(`${item.typeLabel} ${item.payload}`).includes(normalizedSearch));
  }, [basePayloads, normalizedSearch]);

  const selectedDescription =
    selectedType === "all"
      ? "Lista combinada de SQL Injection e XSS para testes de seguranca."
      : SECURITY_PAYLOAD_CATEGORIES[selectedType]?.description || "";

  const copyAll = () => {
    const payloadText = filteredPayloads.map((item) => item.payload).join("\n");
    copyText(
      payloadText,
      setStatusMessage,
      `${filteredPayloads.length} payload(s) copiado(s).`,
      "Nenhum payload para copiar."
    );
  };

  const exportAll = () => {
    if (filteredPayloads.length === 0) {
      setStatusMessage("Nenhum payload para exportar.");
      return;
    }
    const suffix = selectedType === "all" ? "all" : selectedType;
    const lines = filteredPayloads.map((item, index) => `${index + 1}. [${item.typeLabel}] ${item.payload}`);
    downloadText(lines.join("\n"), `payload-set-${suffix}.txt`);
    setStatusMessage(`Arquivo exportado com ${filteredPayloads.length} payload(s).`);
  };

  return (
    <section className="card security-payloads-page">
      <article className="security-payloads-block">
        <h2>SQL Injection / XSS Payload Set</h2>
        <p className="security-payloads-caption">
          Use esses payloads para validar filtros, sanitizacao e encode de saida em ambientes de teste.
        </p>

        <div className="security-payloads-toolbar">
          <label>
            Tipo
            <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
              {SECURITY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Buscar payload
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ex.: union, script, onerror"
            />
          </label>
        </div>

        <p className="security-payloads-description">{selectedDescription}</p>

        <div className="security-payloads-actions">
          <button type="button" onClick={copyAll} disabled={filteredPayloads.length === 0}>
            Copiar lista filtrada
          </button>
          <button type="button" onClick={exportAll} disabled={filteredPayloads.length === 0}>
            Exportar .txt
          </button>
        </div>

        {statusMessage && <p className="security-payloads-message">{statusMessage}</p>}
      </article>

      <article className="security-payloads-block">
        <div className="security-payloads-header">
          <strong>Payloads ({filteredPayloads.length})</strong>
        </div>

        {filteredPayloads.length === 0 && (
          <p className="security-payloads-empty">Nenhum payload encontrado para o filtro atual.</p>
        )}

        {filteredPayloads.length > 0 && (
          <ul className="security-payloads-list">
            {filteredPayloads.map((item, index) => (
              <li className="security-payloads-item" key={`${item.type}-${index}-${item.payload}`}>
                <span className={`security-payloads-type is-${item.type}`}>{item.typeLabel}</span>
                <code>{item.payload}</code>
                <button
                  type="button"
                  onClick={() =>
                    copyText(item.payload, setStatusMessage, "Payload copiado.", "Nenhum payload para copiar.")
                  }
                >
                  Copiar
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
