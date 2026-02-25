import { useMemo, useState } from "react";
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

export default function CompareJsonPage() {
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');

  const compareResult = useMemo(() => {
    const left = tryParseJson(leftJson);
    const right = tryParseJson(rightJson);

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
  }, [leftJson, rightJson]);

  return (
    <section className="card compare-json-page">
      <label>
        JSON A
        <textarea placeholder="Cole o JSON aqui" rows={12} value={leftJson} onChange={(e) => setLeftJson(e.target.value)} />
      </label>

      <label>
        JSON B
        <textarea placeholder="Cole o JSON aqui" rows={12} value={rightJson} onChange={(e) => setRightJson(e.target.value)} />
      </label>

      <div className="compare-json-diff">
        <h2>Diferencas</h2>
        {compareResult.error && <p className="compare-json-error">{compareResult.error}</p>}
        {!compareResult.error && compareResult.diffs.length === 0 && (
          <p className="compare-json-success">Sem diferencas</p>
        )}
        {!compareResult.error && compareResult.diffs.length > 0 && (
          <ul>
            {compareResult.diffs.map((diff, index) => (
              <li key={`${diff.path}-${index}`}>
                <strong>{diff.type.toUpperCase()}</strong> {diff.path}
                {diff.type === "changed"
                  ? ` | A: ${JSON.stringify(diff.left)} | B: ${JSON.stringify(diff.right)}`
                  : ` | valor: ${JSON.stringify(diff.value)}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}