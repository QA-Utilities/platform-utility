import { useState } from "react";
import "../styles/pages/json-tool-page.css";

function tryParseJson(value) {
  try {
    return { ok: true, data: JSON.parse(value) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export default function JsonToolPage() {
  const [pairs, setPairs] = useState([
    { key: "id", value: "123" },
    { key: "status", value: "ok" }
  ]);
  const [jsonRaw, setJsonRaw] = useState('{"hello":"world"}');
  const [jsonOutput, setJsonOutput] = useState("");

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
    pairs.forEach((pair) => {
      const key = pair.key.trim();
      if (!key) return;
      obj[key] = pair.value;
    });
    setJsonOutput(JSON.stringify(obj, null, 2));
  };

  const formatRawJson = () => {
    const parsed = tryParseJson(jsonRaw);
    if (!parsed.ok) {
      setJsonOutput(`Erro: ${parsed.error}`);
      return;
    }
    setJsonOutput(JSON.stringify(parsed.data, null, 2));
  };

  return (
    <section className="card json-tool-page">
      <div>
        <h2>Gerar JSON por campos</h2>
        {pairs.map((pair, index) => (
          <div className="json-tool-row" key={`${pair.key}-${index}`}>
            <input
              placeholder="chave"
              value={pair.key}
              onChange={(e) => updatePair(index, "key", e.target.value)}
            />
            <input
              placeholder="valor"
              value={pair.value}
              onChange={(e) => updatePair(index, "value", e.target.value)}
            />
            <button type="button" onClick={() => removePair(index)}>
              remover
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
        <textarea
          rows={8}
          value={jsonRaw}
          onChange={(e) => setJsonRaw(e.target.value)}
          placeholder="Cole o JSON aqui"
        />
        <button type="button" onClick={formatRawJson}>
          Formatar JSON
        </button>
      </div>

      <label className="json-tool-output">
        Resultado
        <textarea rows={12} value={jsonOutput} readOnly />
      </label>
    </section>
  );
}