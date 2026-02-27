import { useEffect, useMemo, useState } from "react";
import {
  INVALID_EMAIL_PATTERNS,
  PASSWORD_CHAR_GROUPS,
  PASSWORD_PATTERNS,
  STRING_TOOL_SECTION_OPTIONS
} from "../config/presets/stringToolConfigs";
import "../styles/pages/string-tool-page.css";

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
  const enabledGroups = Object.keys(PASSWORD_CHAR_GROUPS).filter((group) => options[group]);
  if (enabledGroups.length === 0) return "";

  const safeLength = Math.max(8, Number(length) || 8, enabledGroups.length);
  const requiredChars = enabledGroups.map((group) => randomItem(PASSWORD_CHAR_GROUPS[group]));
  const allChars = enabledGroups.map((group) => PASSWORD_CHAR_GROUPS[group]).join("");

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

function randomEmailToken() {
  const base = randomItem(INVALID_EMAIL_PATTERNS.localParts);
  const addDigits = Math.random() < 0.45;
  if (!addDigits) return base;
  return `${base}${Math.floor(Math.random() * 999)}`;
}

function buildInvalidEmail() {
  const localA = randomEmailToken();
  const localB = randomEmailToken();
  const domain = randomItem(INVALID_EMAIL_PATTERNS.domainParts);
  const tld = randomItem(INVALID_EMAIL_PATTERNS.tlds);
  const numericSuffix = Math.floor(Math.random() * 90) + 10;

  const variations = [
    `${localA}@${domain}`,
    `${localA}@.${tld}`,
    `${localA}@${domain},${tld}`,
    `${localA}.${domain}.${tld}`,
    `${localA}@`,
    `${localA}..${localB}@${domain}.${tld}`,
    `${localA}(${localB})@${domain}.${tld}`,
    `${localA}@${domain}.xyz${numericSuffix}`,
    `${localA}@@${domain}.${tld}`,
    `${localA} ${localB}@${domain}.${tld}`,
    `.${localA}@${domain}.${tld}`,
    `${localA}@-${domain}.${tld}`
  ];

  return randomItem(variations);
}

function buildInvalidEmailList(size = 8) {
  const total = Math.max(1, Math.min(30, Number(size) || 8));
  const generated = new Set();
  let attempts = 0;

  while (generated.size < total && attempts < total * 30) {
    generated.add(buildInvalidEmail());
    attempts += 1;
  }

  return Array.from(generated);
}

export default function StringToolPage() {
  const [sectionPicker, setSectionPicker] = useState("");
  const [activeSections, setActiveSections] = useState([]);
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

  const [invalidEmailCount, setInvalidEmailCount] = useState(8);
  const [invalidEmailList, setInvalidEmailList] = useState(() => buildInvalidEmailList(8));
  const [invalidEmailMessage, setInvalidEmailMessage] = useState("");

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

  const generateInvalidEmails = () => {
    const nextList = buildInvalidEmailList(invalidEmailCount);
    setInvalidEmailList(nextList);
    setInvalidEmailMessage("Lista de emails invalidos gerada.");
  };

  const copyInvalidEmail = async (emailValue) => {
    if (!emailValue) {
      setInvalidEmailMessage("Email invalido vazio para copiar.");
      return;
    }

    if (!navigator.clipboard) {
      setInvalidEmailMessage("Clipboard indisponivel neste navegador.");
      return;
    }

    try {
      await navigator.clipboard.writeText(emailValue);
      setInvalidEmailMessage("Email invalido copiado.");
    } catch {
      setInvalidEmailMessage("Nao foi possivel copiar o email.");
    }
  };

  const copyInvalidEmailList = async () => {
    if (invalidEmailList.length === 0) {
      setInvalidEmailMessage("Gere ao menos um email invalido.");
      return;
    }

    if (!navigator.clipboard) {
      setInvalidEmailMessage("Clipboard indisponivel neste navegador.");
      return;
    }

    try {
      await navigator.clipboard.writeText(invalidEmailList.join("\n"));
      setInvalidEmailMessage("Lista de emails invalidos copiada.");
    } catch {
      setInvalidEmailMessage("Nao foi possivel copiar a lista.");
    }
  };

  const handleSectionAdd = (event) => {
    const nextSection = event.target.value;
    setSectionPicker("");
    if (!nextSection) return;

    setActiveSections((current) => {
      if (current.includes(nextSection)) return current;
      return [...current, nextSection];
    });
  };

  const removeSection = (sectionKey) => {
    setActiveSections((current) => current.filter((item) => item !== sectionKey));
  };

  const clearSections = () => {
    setActiveSections([]);
  };

  return (
    <section className="card string-page">
      <h2>String</h2>
      <p className="string-intro">Escolha um submenu para exibir o bloco correspondente.</p>

      <div className="string-generator-controls">
        <label className="string-generator-select">
          Tipo de acao
          <select value={sectionPicker} onChange={handleSectionAdd}>
            <option value="">Selecione um tipo</option>
            {STRING_TOOL_SECTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} disabled={activeSections.includes(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="string-generator-hint">Escolha um tipo e ele sera adicionado automaticamente.</p>

      {activeSections.length > 0 && (
        <div className="string-selected-list">
          {activeSections.map((sectionKey) => {
            const label = STRING_TOOL_SECTION_OPTIONS.find((option) => option.value === sectionKey)?.label || sectionKey;
            return (
              <span className="string-selected-item" key={sectionKey}>
                {label}
                <button type="button" onClick={() => removeSection(sectionKey)}>
                  Remover
                </button>
              </span>
            );
          })}
          <button type="button" className="string-clear-button" onClick={clearSections}>
            Limpar todos
          </button>
        </div>
      )}

      <div className={`string-grid${activeSections.length === 1 ? " string-grid-single" : ""}`}>
        {activeSections.length === 0 && (
          <p className="string-select-hint">
            Selecione um tipo de acao acima para exibir o menu correspondente.
          </p>
        )}

        {activeSections.includes("password") && (
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
                  &#8635;
                </button>
                <button type="button" onClick={copyPassword} disabled={!passwordOutput}>
                  Copiar senha
                </button>
              </div>
            </div>

            <div className="string-strength-row">
              <div
                className="string-strength-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={strengthInfo.width}
              >
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
        )}

        {activeSections.includes("counter") && (
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
        )}

        {activeSections.includes("invalid-email") && (
          <article className="string-block string-invalid-emails">
            <h2>Gerador de emails invalidos</h2>
            <p className="string-password-caption">
              Gera exemplos variados para validar campos de email com cenarios incorretos.
            </p>

            <div className="string-invalid-toolbar">
              <label className="string-invalid-count">
                Quantidade
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={invalidEmailCount}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value) || 1;
                    setInvalidEmailCount(Math.max(1, Math.min(30, nextValue)));
                  }}
                />
              </label>

              <button type="button" onClick={generateInvalidEmails}>
                Gerar emails invalidos
              </button>
              <button type="button" onClick={copyInvalidEmailList} disabled={invalidEmailList.length === 0}>
                Copiar lista
              </button>
            </div>

            <ul className="string-invalid-list">
              {invalidEmailList.map((invalidEmail, index) => (
                <li key={`${invalidEmail}-${index}`} className="string-invalid-item">
                  <code>{invalidEmail}</code>
                  <button type="button" onClick={() => copyInvalidEmail(invalidEmail)}>
                    Copiar
                  </button>
                </li>
              ))}
            </ul>

            {invalidEmailMessage && <p className="string-message">{invalidEmailMessage}</p>}
          </article>
        )}

        {activeSections.includes("occurrence") && (
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
        )}
      </div>
    </section>
  );
}
