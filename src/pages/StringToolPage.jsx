import { useEffect, useMemo, useState } from "react";
import "../styles/pages/string-tool-page.css";

const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const NUMBER_CHARS = "0123456789";
const SPECIAL_CHARS = "!@#$%&*()-_=+[]{}<>?";

const PASSWORD_PATTERNS = {
  basic: {
    title: "Padrao 1",
    label: "8+ caracteres, 1 letra maiuscula e 1 minuscula",
    config: { upper: true, lower: true, number: false, special: false }
  },
  special: {
    title: "Padrao 2",
    label: "8+ caracteres, 1 maiuscula, 1 minuscula e 1 especial",
    config: { upper: true, lower: true, number: false, special: true }
  },
  strong: {
    title: "Padrao 3",
    label: "8+ caracteres, 1 maiuscula, 1 minuscula, 1 especial e 1 numero",
    config: { upper: true, lower: true, number: true, special: true }
  }
};

function randomItem(value) {
  return value[Math.floor(Math.random() * value.length)];
}

function shuffleText(value) {
  const chars = value.split("");
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function buildPassword(length, options) {
  const groups = {
    upper: UPPERCASE_CHARS,
    lower: LOWERCASE_CHARS,
    number: NUMBER_CHARS,
    special: SPECIAL_CHARS
  };

  const enabledGroups = Object.keys(groups).filter((group) => options[group]);
  if (enabledGroups.length === 0) return "";

  const safeLength = Math.max(8, Number(length) || 8, enabledGroups.length);
  const requiredChars = enabledGroups.map((group) => randomItem(groups[group]));
  const allChars = enabledGroups.map((group) => groups[group]).join("");

  let password = requiredChars.join("");
  for (let i = requiredChars.length; i < safeLength; i += 1) {
    password += randomItem(allChars);
  }

  return shuffleText(password);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countWordOccurrences(text, searchWord, caseSensitive) {
  const query = (searchWord || "").trim();
  if (!query) return 0;

  const flags = caseSensitive ? "g" : "gi";
  const regex = new RegExp(`\\b${escapeRegExp(query)}\\b`, flags);
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

export default function StringToolPage() {
  const [passwordPattern, setPasswordPattern] = useState("strong");
  const [passwordLength, setPasswordLength] = useState(12);
  const [passwordOutput, setPasswordOutput] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumber, setIncludeNumber] = useState(true);
  const [includeSpecial, setIncludeSpecial] = useState(true);

  const [counterText, setCounterText] = useState("");

  const [occurrenceText, setOccurrenceText] = useState("");
  const [searchWord, setSearchWord] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);

  const counterStats = useMemo(() => {
    const totalCharacters = counterText.length;
    const charactersWithoutSpaces = counterText.replace(/\s/g, "").length;
    const wordCount = counterText.trim() ? counterText.trim().split(/\s+/).length : 0;
    const lineCount = counterText ? counterText.split(/\r?\n/).length : 0;

    return { totalCharacters, charactersWithoutSpaces, wordCount, lineCount };
  }, [counterText]);

  const occurrenceCount = useMemo(() => {
    return countWordOccurrences(occurrenceText, searchWord, caseSensitive);
  }, [occurrenceText, searchWord, caseSensitive]);

  const strengthInfo = useMemo(() => {
    const enabledCount = [includeUpper, includeLower, includeNumber, includeSpecial].filter(Boolean).length;
    let score = 0;
    if (passwordLength >= 8) score += 1;
    if (passwordLength >= 12) score += 1;
    if (passwordLength >= 16) score += 1;
    score += enabledCount;

    if (score <= 3) return { label: "Fraca", tone: "weak", width: 35 };
    if (score <= 5) return { label: "Media", tone: "medium", width: 68 };
    return { label: "Forte", tone: "strong", width: 100 };
  }, [passwordLength, includeUpper, includeLower, includeNumber, includeSpecial]);

  const generatePassword = (notify = true) => {
    const password = buildPassword(passwordLength, {
      upper: includeUpper,
      lower: includeLower,
      number: includeNumber,
      special: includeSpecial
    });
    if (!password) {
      setPasswordMessage("Selecione ao menos um tipo de caractere.");
      setPasswordOutput("");
      return;
    }
    setPasswordOutput(password);
    if (notify) setPasswordMessage("Senha gerada com sucesso.");
  };

  useEffect(() => {
    generatePassword(false);
  }, [passwordLength, includeUpper, includeLower, includeNumber, includeSpecial]);

  const applyPasswordPattern = (patternKey) => {
    const pattern = PASSWORD_PATTERNS[patternKey];
    if (!pattern) return;
    setPasswordPattern(patternKey);
    setIncludeUpper(pattern.config.upper);
    setIncludeLower(pattern.config.lower);
    setIncludeNumber(pattern.config.number);
    setIncludeSpecial(pattern.config.special);
  };

  const toggleCharType = (type) => {
    const current = {
      upper: includeUpper,
      lower: includeLower,
      number: includeNumber,
      special: includeSpecial
    };

    const nextValue = !current[type];
    const next = { ...current, [type]: nextValue };
    const enabledCount = Object.values(next).filter(Boolean).length;

    if (enabledCount === 0) {
      setPasswordMessage("Mantenha ao menos um tipo de caractere marcado.");
      return;
    }

    setPasswordPattern("custom");
    setIncludeUpper(next.upper);
    setIncludeLower(next.lower);
    setIncludeNumber(next.number);
    setIncludeSpecial(next.special);
  };

  const copyPassword = async () => {
    if (!passwordOutput) {
      setPasswordMessage("Gere uma senha antes de copiar.");
      return;
    }

    if (!navigator.clipboard) {
      setPasswordMessage("Clipboard indisponivel neste navegador.");
      return;
    }

    try {
      await navigator.clipboard.writeText(passwordOutput);
      setPasswordMessage("Senha copiada.");
    } catch {
      setPasswordMessage("Nao foi possivel copiar a senha.");
    }
  };

  return (
    <section className="card string-page">
      <article className="string-block">
        <h2>Criar senha</h2>
        <p className="string-password-caption">Gere instantaneamente uma senha segura e aleatoria.</p>

        <div className="string-pattern-buttons">
          {Object.entries(PASSWORD_PATTERNS).map(([key, pattern]) => (
            <button
              key={key}
              type="button"
              className={`string-pattern-button${passwordPattern === key ? " is-active" : ""}`}
              onClick={() => applyPasswordPattern(key)}
              title={pattern.label}
            >
              {pattern.title}
            </button>
          ))}
        </div>

        <div className="string-password-output">
          <code>{passwordOutput || "Clique em gerar para criar uma senha"}</code>
          <div className="string-password-output-actions">
            <button
              type="button"
              className="string-icon-button"
              onClick={() => generatePassword(true)}
              aria-label="Gerar novamente"
              title="Gerar novamente"
            >
              ↻
            </button>
            <button type="button" onClick={copyPassword} disabled={!passwordOutput}>
              Copiar senha
            </button>
          </div>
        </div>

        <div className="string-strength-row">
          <div className="string-strength-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={strengthInfo.width}>
            <span className={`string-strength-fill is-${strengthInfo.tone}`} style={{ width: `${strengthInfo.width}%` }} />
          </div>
          <span className={`string-strength-label is-${strengthInfo.tone}`}>{strengthInfo.label}</span>
        </div>

        <div className="string-password-controls">
          <label className="string-range-label">
            Numero de caracteres da senha <strong>{passwordLength}</strong>
          </label>
          <input
            type="range"
            min={8}
            max={64}
            step={1}
            value={passwordLength}
            onChange={(event) => setPasswordLength(Math.max(8, Number(event.target.value) || 8))}
          />

          <div className="string-char-types">
            <label className="string-checkbox">
              <input type="checkbox" checked={includeUpper} onChange={() => toggleCharType("upper")} />
              Letra maiuscula
            </label>
            <label className="string-checkbox">
              <input type="checkbox" checked={includeLower} onChange={() => toggleCharType("lower")} />
              Letra minuscula
            </label>
            <label className="string-checkbox">
              <input type="checkbox" checked={includeNumber} onChange={() => toggleCharType("number")} />
              Numeros
            </label>
            <label className="string-checkbox">
              <input type="checkbox" checked={includeSpecial} onChange={() => toggleCharType("special")} />
              Simbolos
            </label>
          </div>
        </div>

        {passwordMessage && <p className="string-message">{passwordMessage}</p>}
      </article>

      <article className="string-block">
        <h2>Contador de caracteres</h2>
        <label>
          Texto
          <textarea
            rows={8}
            value={counterText}
            onChange={(event) => setCounterText(event.target.value)}
            placeholder="Digite ou cole um texto para contar os caracteres"
          />
        </label>

        <div className="string-stats">
          <p>Total de caracteres: <strong>{counterStats.totalCharacters}</strong></p>
          <p>Sem espacos: <strong>{counterStats.charactersWithoutSpaces}</strong></p>
          <p>Total de palavras: <strong>{counterStats.wordCount}</strong></p>
          <p>Total de linhas: <strong>{counterStats.lineCount}</strong></p>
        </div>
      </article>

      <article className="string-block string-occurrence">
        <h2>Contador de ocorrencia de palavra</h2>

        <label>
          Palavra ou termo
          <input
            value={searchWord}
            onChange={(event) => setSearchWord(event.target.value)}
            placeholder="Ex.: erro"
          />
        </label>

        <label className="string-checkbox">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(event) => setCaseSensitive(event.target.checked)}
          />
          Diferenciar maiusculas e minusculas
        </label>

        <label>
          Texto para busca
          <textarea
            rows={10}
            value={occurrenceText}
            onChange={(event) => setOccurrenceText(event.target.value)}
            placeholder="Digite ou cole o texto para contar ocorrencias"
          />
        </label>

        <p className="string-occurrence-result">
          Ocorrencias encontradas: <strong>{occurrenceCount}</strong>
        </p>
      </article>
    </section>
  );
}
