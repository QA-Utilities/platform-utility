import { useMemo, useState } from "react";
import {
  TEST_CASE_ANALYSIS_KEYWORDS,
  TEST_CASE_CATEGORY_OPTIONS,
  TEST_CASE_DEFAULT_RULE,
  TEST_CASE_PRIORITY_BY_CATEGORY,
  TEST_CASE_SECURITY_PAYLOAD_SAMPLES,
  TEST_CASE_STOP_WORDS,
  TEST_CASE_TARGET_OPTIONS
} from "../config/presets/testCaseGeneratorConfigs";
import "../styles/pages/test-case-generator-page.css";

function normalize(value) {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function uniqIgnoreCase(values) {
  const map = new Map();
  values.forEach((item) => {
    const clean = String(item || "").trim();
    if (!clean) return;
    const key = normalize(clean);
    if (!map.has(key)) map.set(key, clean);
  });
  return Array.from(map.values());
}

function splitList(value) {
  return uniqIgnoreCase(
    String(value || "")
      .replace(/[.]/g, " ")
      .split(/,|;|\se\s|\sand\s|\n/gi)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function containsAny(text, keywords) {
  const value = normalize(text);
  return keywords.some((keyword) => value.includes(normalize(keyword)));
}

function featureNameFromRule(ruleText) {
  const firstLine = String(ruleText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return "Regra de negocio";
  const cleaned = firstLine.replace(/^regra\s*:\s*/i, "").trim();
  return cleaned || "Regra de negocio";
}

function extractFields(ruleText) {
  const source = String(ruleText || "");
  const candidates = [];

  for (const match of source.matchAll(/["'`](.{2,35}?)["'`]/g)) candidates.push(match[1]);
  for (const match of source.matchAll(/(?:campo|campos|field|fields|atributo|parametro|parametros)\s*[:\-]?\s*([^\n]+)/gi)) {
    splitList(match[1]).forEach((item) => candidates.push(item));
  }
  for (const match of source.matchAll(/["']([a-zA-Z_][\w.-]{1,30})["']\s*:/g)) candidates.push(match[1]);

  return uniqIgnoreCase(
    candidates
      .map((item) => item.replace(/[^a-zA-Z0-9_. -]/g, "").trim())
      .filter((item) => item.length >= 2 && item.length <= 35)
      .filter((item) => !TEST_CASE_STOP_WORDS.includes(normalize(item)))
  );
}

function extractRequiredFields(ruleText, fields) {
  const explicit = [];
  for (const match of String(ruleText || "").matchAll(/(?:obrigatori[oa]s?|required(?: fields?)?)\s*[:\-]\s*([^\n]+)/gi)) {
    splitList(match[1]).forEach((item) => explicit.push(item));
  }

  const required = uniqIgnoreCase(explicit);
  if (required.length > 0) return required;
  if (containsAny(ruleText, TEST_CASE_ANALYSIS_KEYWORDS.required)) return fields.slice(0, Math.min(4, fields.length));
  return [];
}

function extractLength(ruleText) {
  const value = normalize(ruleText);
  const pick = (patterns) => {
    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match) return Number(match[1]);
    }
    return null;
  };

  return {
    min: pick([/minimo(?: de)?\s*(\d+)\s*(?:caracteres|chars|digitos|digits)/i, /(\d+)\s*(?:caracteres|chars|digitos|digits)\s*minimos?/i]),
    max: pick([/maximo(?: de)?\s*(\d+)\s*(?:caracteres|chars|digitos|digits)/i, /(\d+)\s*(?:caracteres|chars|digitos|digits)\s*maximos?/i]),
    exact: pick([/(\d+)\s*(?:caracteres|chars|digitos|digits)\s*(?:exatos|exato|exact)/i])
  };
}

function extractHttpCodes(ruleText) {
  const codes = Array.from(String(ruleText || "").matchAll(/\b([1-5]\d{2})\b/g)).map((match) => Number(match[1]));
  return {
    success: codes.find((code) => code >= 200 && code <= 299) || 200,
    error: codes.find((code) => code >= 400 && code <= 599) || 400
  };
}

function categoryLabel(key) {
  return TEST_CASE_CATEGORY_OPTIONS.find((option) => option.value === key)?.label || "Geral";
}

function buildCase({ category, priority, title, objective, preconditions = [], steps = [], expected }) {
  return {
    category,
    priority,
    title,
    objective,
    preconditions: preconditions.filter(Boolean),
    steps: steps.filter(Boolean),
    expected: expected || "Resultado esperado nao informado."
  };
}

function dedupeCases(cases) {
  const map = new Map();
  cases.forEach((testCase) => {
    const key = `${normalize(testCase.category)}|${normalize(testCase.title)}`;
    if (!map.has(key)) map.set(key, testCase);
  });

  return Array.from(map.values()).map((testCase, index) => ({
    id: `TC-${String(index + 1).padStart(3, "0")}`,
    ...testCase
  }));
}

function deriveRuleSignals(ruleText) {
  const fields = extractFields(ruleText);
  const required = extractRequiredFields(ruleText, fields);
  const lengths = extractLength(ruleText);
  const codes = extractHttpCodes(ruleText);
  const normalizedRule = normalize(ruleText);

  return {
    fields,
    required,
    lengths,
    codes,
    hasUnique: containsAny(normalizedRule, TEST_CASE_ANALYSIS_KEYWORDS.unique),
    hasAuth: containsAny(normalizedRule, TEST_CASE_ANALYSIS_KEYWORDS.auth),
    hasEmail: containsAny(normalizedRule, TEST_CASE_ANALYSIS_KEYWORDS.email) || fields.some((field) => normalize(field).includes("email")),
    hasPhone: containsAny(normalizedRule, TEST_CASE_ANALYSIS_KEYWORDS.phone),
    hasDocument: containsAny(normalizedRule, TEST_CASE_ANALYSIS_KEYWORDS.cpf) || containsAny(normalizedRule, TEST_CASE_ANALYSIS_KEYWORDS.cnpj)
  };
}

function buildBackendCases(signals, enabled) {
  const { required, lengths, codes, hasUnique, hasAuth, hasEmail, hasPhone, hasDocument } = signals;
  const focusField = required[0] || signals.fields[0] || "campo principal";
  const cases = [];

  if (enabled.positive) {
    cases.push(
      buildCase({
        category: categoryLabel("positive"),
        priority: TEST_CASE_PRIORITY_BY_CATEGORY.positive,
        title: "[Backend] Fluxo valido com retorno de sucesso",
        objective: "Validar caminho feliz de API com dados corretos.",
        preconditions: ["Ambiente e credenciais de API disponiveis."],
        steps: ["Montar payload valido.", "Executar envio.", "Validar status e body da resposta."],
        expected: `Retorno de sucesso com status ${codes.success}.`
      })
    );

    if (required.length > 0) {
      cases.push(
        buildCase({
          category: categoryLabel("positive"),
          priority: "Alta",
          title: "[Backend] Aceitar todos os obrigatorios preenchidos",
          objective: "Garantir aceite da entrada completa no endpoint.",
          preconditions: ["Campos obrigatorios configurados."],
          steps: [`Preencher: ${required.join(", ")}.`, "Enviar requisicao."],
          expected: `Sem erro de validacao e status ${codes.success}.`
        })
      );
    }
  }

  if (enabled.negative) {
    if (required.length > 0) {
      required.slice(0, 5).forEach((field) => {
        cases.push(
          buildCase({
            category: categoryLabel("negative"),
            priority: "Alta",
            title: `[Backend] Rejeitar obrigatorio ausente: ${field}`,
            objective: "Cobrir validacao de obrigatoriedade.",
            preconditions: ["Payload base valido pronto."],
            steps: [`Remover campo ${field}.`, "Enviar requisicao."],
            expected: `Erro de validacao com status ${codes.error}.`
          })
        );
      });
    }

    if (hasEmail) {
      cases.push(
        buildCase({
          category: categoryLabel("negative"),
          priority: "Alta",
          title: "[Backend] Rejeitar email invalido",
          objective: "Garantir formato de email correto no payload.",
          preconditions: ["Campo de email habilitado."],
          steps: ["Informar usuario@dominio.", "Enviar requisicao."],
          expected: `Email invalido com status ${codes.error}.`
        })
      );
    }

    if (hasUnique) {
      cases.push(
        buildCase({
          category: categoryLabel("negative"),
          priority: "Alta",
          title: "[Backend] Rejeitar dado duplicado",
          objective: "Validar unicidade de registro.",
          preconditions: ["Registro com mesmo identificador ja existe."],
          steps: ["Repetir identificador unico.", "Enviar requisicao."],
          expected: "Sistema nao deve aceitar duplicidade."
        })
      );
    }

    if (hasPhone) {
      cases.push(
        buildCase({
          category: categoryLabel("negative"),
          priority: "Media",
          title: "[Backend] Rejeitar telefone invalido",
          objective: "Cobrir validacao de telefone na API.",
          preconditions: ["Campo de telefone habilitado."],
          steps: ["Enviar telefone com letras.", "Submeter requisicao."],
          expected: "Erro de validacao de telefone."
        })
      );
    }

    if (hasDocument) {
      cases.push(
        buildCase({
          category: categoryLabel("negative"),
          priority: "Alta",
          title: "[Backend] Rejeitar documento invalido",
          objective: "Cobrir validacao de CPF/CNPJ.",
          preconditions: ["Campo de documento habilitado."],
          steps: ["Informar documento fora do padrao.", "Enviar requisicao."],
          expected: "Erro de formato/checksum de documento."
        })
      );
    }

    if (hasAuth) {
      cases.push(
        buildCase({
          category: categoryLabel("negative"),
          priority: "Alta",
          title: "[Backend] Bloquear acesso sem autenticacao",
          objective: "Garantir controle de acesso no endpoint.",
          preconditions: ["Endpoint protegido por credencial."],
          steps: ["Remover token.", "Executar chamada."],
          expected: "Resposta 401/403 sem processar a operacao."
        })
      );
    }
  }

  if (enabled.boundary) {
    if (Number.isFinite(lengths.exact)) {
      const size = Number(lengths.exact);
      cases.push(
        buildCase({
          category: categoryLabel("boundary"),
          priority: "Media",
          title: `[Backend] Validar tamanho exato ${size}`,
          objective: "Cobrir fronteira de tamanho no payload.",
          preconditions: ["Campo textual com regra de tamanho exato."],
          steps: [`Testar ${Math.max(size - 1, 0)}, ${size} e ${size + 1} caracteres.`],
          expected: `${size} aceito, fora do limite rejeitado.`
        })
      );
    } else {
      if (Number.isFinite(lengths.min)) {
        const size = Number(lengths.min);
        cases.push(
          buildCase({
            category: categoryLabel("boundary"),
            priority: "Media",
            title: `[Backend] Borda inferior minimo ${size}`,
            objective: "Cobrir limite minimo na API.",
            preconditions: ["Campo com regra minima."],
            steps: [`Testar ${Math.max(size - 1, 0)}, ${size} e ${size + 1} caracteres.`],
            expected: `Aceitar somente valores >= ${size}.`
          })
        );
      }
      if (Number.isFinite(lengths.max)) {
        const size = Number(lengths.max);
        cases.push(
          buildCase({
            category: categoryLabel("boundary"),
            priority: "Media",
            title: `[Backend] Borda superior maximo ${size}`,
            objective: "Cobrir limite maximo na API.",
            preconditions: ["Campo com regra maxima."],
            steps: [`Testar ${Math.max(size - 1, 0)}, ${size} e ${size + 1} caracteres.`],
            expected: `Aceitar somente valores <= ${size}.`
          })
        );
      }
    }
  }

  if (enabled.security) {
    cases.push(
      buildCase({
        category: categoryLabel("security"),
        priority: "Alta",
        title: "[Backend] Bloquear SQL Injection",
        objective: "Validar protecao contra injecao SQL.",
        preconditions: ["Campo textual disponivel para entrada."],
        steps: [`Enviar ${TEST_CASE_SECURITY_PAYLOAD_SAMPLES.sqlInjection} no campo ${focusField}.`],
        expected: "Sistema bloqueia payload e nao executa comando indevido."
      })
    );

    cases.push(
      buildCase({
        category: categoryLabel("security"),
        priority: "Alta",
        title: "[Backend] Bloquear XSS",
        objective: "Validar sanitizacao na camada de API.",
        preconditions: ["Campo textual refletido/armazenado na aplicacao."],
        steps: [`Enviar ${TEST_CASE_SECURITY_PAYLOAD_SAMPLES.xss} no campo ${focusField}.`, "Processar retorno da API."],
        expected: "Payload perigoso tratado sem execucao."
      })
    );
  }

  if (enabled.regression) {
    cases.push(
      buildCase({
        category: categoryLabel("regression"),
        priority: "Media",
        title: "[Backend] Executar baseline de regressao",
        objective: "Garantir que alteracoes nao quebraram cenarios antigos.",
        preconditions: ["Suite baseline de API disponivel."],
        steps: ["Executar cenarios principais anteriores.", "Comparar resultados esperados."],
        expected: "Sem regressao funcional apos mudanca de regra."
      })
    );
  }

  return cases;
}

function buildFrontendCases(signals, enabled) {
  const { required, lengths, hasUnique, hasAuth, hasEmail, hasPhone, hasDocument } = signals;
  const focusField = required[0] || signals.fields[0] || "campo principal";
  const cases = [];

  if (enabled.positive) {
    cases.push(
      buildCase({
        category: categoryLabel("positive"),
        priority: "Alta",
        title: "[Frontend] Fluxo valido com feedback de sucesso",
        objective: "Garantir preenchimento e submissao corretos pela UI.",
        preconditions: ["Tela da funcionalidade carregada."],
        steps: ["Preencher formulario com dados validos.", "Clicar no botao de enviar/salvar.", "Validar feedback visual de sucesso."],
        expected: "Tela apresenta sucesso e estado final correto."
      })
    );

    if (required.length > 0) {
      cases.push(
        buildCase({
          category: categoryLabel("positive"),
          priority: "Alta",
          title: "[Frontend] Habilitar envio com obrigatorios preenchidos",
          objective: "Validar comportamento de botao e campos obrigatorios.",
          preconditions: ["Formulario com validacao client-side ativa."],
          steps: [`Preencher: ${required.join(", ")}.`, "Observar estado do botao de enviar."],
          expected: "Botao fica habilitado quando os obrigatorios sao validos."
        })
      );
    }
  }

  if (enabled.negative) {
    if (required.length > 0) {
      required.slice(0, 5).forEach((field) => {
        cases.push(
          buildCase({
            category: categoryLabel("negative"),
            priority: "Alta",
            title: `[Frontend] Exibir erro de obrigatoriedade: ${field}`,
            objective: "Garantir mensagem inline e acessibilidade do erro.",
            preconditions: ["Formulario carregado."],
            steps: [`Deixar ${field} vazio.`, "Tentar enviar formulario."],
            expected: "Mensagem de obrigatorio exibida junto ao campo e envio bloqueado."
          })
        );
      });
    }

    if (hasEmail) {
      cases.push(
        buildCase({
          category: categoryLabel("negative"),
          priority: "Alta",
          title: "[Frontend] Validar formato de email invalido",
          objective: "Exibir erro visual para formato invalido.",
          preconditions: ["Campo de email visivel na tela."],
          steps: ["Informar usuario@dominio.", "Tentar enviar."],
          expected: "Mensagem de formato invalido exibida sem quebrar layout."
        })
      );
    }

    if (hasPhone) {
      cases.push(
        buildCase({
          category: categoryLabel("negative"),
          priority: "Media",
          title: "[Frontend] Rejeitar telefone fora do padrao",
          objective: "Cobrir mascara e validacao client-side.",
          preconditions: ["Campo de telefone com mascara/validacao."],
          steps: ["Informar letras/simbolos invalidos.", "Sair do campo e tentar enviar."],
          expected: "Erro de validacao exibido e valor invalido bloqueado."
        })
      );
    }

    if (hasDocument) {
      cases.push(
        buildCase({
          category: categoryLabel("negative"),
          priority: "Alta",
          title: "[Frontend] Rejeitar documento invalido na UI",
          objective: "Validar formato/checksum em nivel de interface.",
          preconditions: ["Campo de documento disponivel."],
          steps: ["Informar documento invalido.", "Submeter formulario."],
          expected: "Mensagem de erro exibida no campo de documento."
        })
      );
    }

    if (hasUnique) {
      cases.push(
        buildCase({
          category: categoryLabel("negative"),
          priority: "Media",
          title: "[Frontend] Exibir erro de duplicidade retornado pela API",
          objective: "Garantir tratamento visual de conflito.",
          preconditions: ["Registro duplicado ja existente."],
          steps: ["Enviar formulario com dado duplicado.", "Aguardar resposta de conflito."],
          expected: "Erro amigavel exibido para o usuario sem travar a tela."
        })
      );
    }

    if (hasAuth) {
      cases.push(
        buildCase({
          category: categoryLabel("negative"),
          priority: "Alta",
          title: "[Frontend] Bloquear fluxo sem autenticacao",
          objective: "Garantir protecao de rota e redirecionamento.",
          preconditions: ["Usuario deslogado."],
          steps: ["Acessar tela protegida."],
          expected: "Usuario redirecionado para login ou tela de acesso negado."
        })
      );
    }
  }

  if (enabled.boundary) {
    if (Number.isFinite(lengths.exact)) {
      const size = Number(lengths.exact);
      cases.push(
        buildCase({
          category: categoryLabel("boundary"),
          priority: "Media",
          title: `[Frontend] Validar tamanho exato ${size} no input`,
          objective: "Cobrir mensagens e contador de caracteres na UI.",
          preconditions: ["Campo com restricao de tamanho exato."],
          steps: [`Digitar ${Math.max(size - 1, 0)}, ${size} e ${size + 1} caracteres.`],
          expected: `${size} aceito; demais cenarios exibem erro visual correto.`
        })
      );
    } else {
      if (Number.isFinite(lengths.min)) {
        const size = Number(lengths.min);
        cases.push(
          buildCase({
            category: categoryLabel("boundary"),
            priority: "Media",
            title: `[Frontend] Borda minima ${size} no campo ${focusField}`,
            objective: "Validar comportamento do input no limite inferior.",
            preconditions: ["Campo com validacao de tamanho minimo."],
            steps: [`Digitar ${Math.max(size - 1, 0)}, ${size} e ${size + 1} caracteres.`],
            expected: "UI sinaliza erro apenas abaixo do minimo."
          })
        );
      }
      if (Number.isFinite(lengths.max)) {
        const size = Number(lengths.max);
        cases.push(
          buildCase({
            category: categoryLabel("boundary"),
            priority: "Media",
            title: `[Frontend] Borda maxima ${size} no campo ${focusField}`,
            objective: "Validar limite superior e feedback visual.",
            preconditions: ["Campo com validacao de tamanho maximo."],
            steps: [`Digitar ${Math.max(size - 1, 0)}, ${size} e ${size + 1} caracteres.`],
            expected: "UI bloqueia/exibe erro para valor acima do maximo."
          })
        );
      }
    }
  }

  if (enabled.security) {
    cases.push(
      buildCase({
        category: categoryLabel("security"),
        priority: "Alta",
        title: "[Frontend] Escapar script no render de texto",
        objective: "Evitar XSS refletido/armazenado na interface.",
        preconditions: ["Tela renderiza o valor inserido."],
        steps: [`Informar ${TEST_CASE_SECURITY_PAYLOAD_SAMPLES.xss} no campo ${focusField}.`, "Salvar e reabrir tela."],
        expected: "Script exibido como texto e nunca executado."
      })
    );
  }

  if (enabled.regression) {
    cases.push(
      buildCase({
        category: categoryLabel("regression"),
        priority: "Media",
        title: "[Frontend] Regressao de validacoes e layout",
        objective: "Garantir que mudancas na regra nao quebraram comportamento visual.",
        preconditions: ["Build da interface atualizado."],
        steps: ["Executar fluxo principal e cenarios de erro.", "Validar mensagens, alinhamento e responsividade."],
        expected: "Fluxos antigos permanecem funcionando sem quebra visual."
      })
    );
  }

  return cases;
}

function buildLocalCases(ruleText, enabled, targetType = "both") {
  const signals = deriveRuleSignals(ruleText);
  const allCases = [];

  if (targetType === "backend" || targetType === "both") {
    allCases.push(...buildBackendCases(signals, enabled));
  }
  if (targetType === "frontend" || targetType === "both") {
    allCases.push(...buildFrontendCases(signals, enabled));
  }

  return dedupeCases(allCases);
}

function isRuleInScope(ruleText) {
  const source = String(ruleText || "");
  const value = normalize(source);
  if (!value.trim()) return false;

  const scopeTerms = [
    "regra",
    "requisito",
    "criterio de aceite",
    "campo",
    "obrigatorio",
    "validacao",
    "erro",
    "sucesso",
    "status",
    "payload",
    "json",
    "api",
    "endpoint",
    "tela",
    "formulario",
    "frontend",
    "backend",
    "usuario",
    "cadastro",
    "login",
    "senha",
    "email",
    "cpf",
    "cnpj",
    "telefone",
    "cenario",
    "gherkin",
    "given",
    "when",
    "then",
    "must",
    "should",
    "required"
  ];

  let hitCount = 0;
  scopeTerms.forEach((term) => {
    if (value.includes(normalize(term))) hitCount += 1;
  });

  const hasBehaviorHint = /(deve|quando|entao|nao pode|retornar|validar|aceitar|rejeitar|must|should|required|given|when|then)/i
    .test(source);
  const hasRuleStructure = /[-*]\s+/.test(source) || /\b\d+[.)]\s+/.test(source);

  return hitCount >= 2 || (hitCount >= 1 && (hasBehaviorHint || hasRuleStructure));
}

function outOfScopeMessage() {
  return "IA local restrita: ela so gera casos de teste a partir de regra funcional (campos, validacoes, status e fluxo).";
}

function toTag(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "tag";
}

function buildGherkin(cases, featureName) {
  if (cases.length === 0) return "";

  const lines = [
    `Feature: ${featureName}`,
    "  Como QA",
    "  Quero validar a regra de negocio",
    "  Para garantir qualidade funcional e tecnica"
  ];

  cases.forEach((testCase) => {
    lines.push("");
    lines.push(`  @${toTag(testCase.category)} @${toTag(testCase.priority)} @${toTag(testCase.id)}`);
    lines.push(`  Scenario: ${testCase.id} - ${testCase.title}`);

    const preconditions = testCase.preconditions.length > 0
      ? testCase.preconditions
      : ["o sistema esta disponivel"];
    preconditions.forEach((item, index) => lines.push(`    ${index === 0 ? "Given" : "And"} ${item}`));

    const steps = testCase.steps.length > 0
      ? testCase.steps
      : ["envio a operacao com dados de teste"];
    steps.forEach((item, index) => lines.push(`    ${index === 0 ? "When" : "And"} ${item}`));

    lines.push(`    Then ${testCase.expected}`);
  });

  return lines.join("\n");
}

async function copyText(value, setStatusMessage, successMessage, emptyMessage) {
  if (!value) {
    setStatusMessage(emptyMessage);
    return;
  }

  if (!navigator.clipboard) {
    setStatusMessage("Clipboard indisponivel neste navegador.");
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    setStatusMessage(successMessage);
  } catch {
    setStatusMessage("Nao foi possivel copiar.");
  }
}

export default function TestCaseGeneratorPage() {
  const [ruleText, setRuleText] = useState(TEST_CASE_DEFAULT_RULE);
  const [targetType, setTargetType] = useState("both");
  const [enabledCategories, setEnabledCategories] = useState(() =>
    TEST_CASE_CATEGORY_OPTIONS.reduce((acc, option) => ({ ...acc, [option.value]: true }), {})
  );
  const [generatedCases, setGeneratedCases] = useState([]);
  const [generatedCasesRaw, setGeneratedCasesRaw] = useState("");
  const [gherkinOutput, setGherkinOutput] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const featureName = useMemo(() => featureNameFromRule(ruleText), [ruleText]);
  const caseCounters = useMemo(() => {
    const counters = {};
    generatedCases.forEach((testCase) => {
      counters[testCase.category] = (counters[testCase.category] || 0) + 1;
    });
    return counters;
  }, [generatedCases]);

  const toggleCategory = (categoryKey) => {
    setEnabledCategories((current) => ({ ...current, [categoryKey]: !current[categoryKey] }));
  };

  const analyzeLocal = () => {
    if (!ruleText.trim()) {
      setStatusMessage("Informe a regra para analisar.");
      return;
    }

    if (!isRuleInScope(ruleText)) {
      setGeneratedCases([]);
      setGeneratedCasesRaw("");
      setGherkinOutput("");
      setStatusMessage(outOfScopeMessage());
      return;
    }

    if (!Object.values(enabledCategories).some(Boolean)) {
      setStatusMessage("Selecione ao menos uma categoria.");
      return;
    }

    const result = buildLocalCases(ruleText, enabledCategories, targetType);
    setGeneratedCases(result);
    setGeneratedCasesRaw(JSON.stringify(result, null, 2));
    setStatusMessage(`${result.length} caso(s) gerado(s) pela IA local para ${targetType}.`);
  };

  const generateGherkin = () => {
    if (generatedCases.length === 0) {
      setStatusMessage("Gere casos antes de montar o Gherkin.");
      return;
    }

    setGherkinOutput(buildGherkin(generatedCases, featureName));
    setStatusMessage("Gherkin gerado com sucesso.");
  };

  const clearAll = () => {
    setRuleText("");
    setTargetType("both");
    setGeneratedCases([]);
    setGeneratedCasesRaw("");
    setGherkinOutput("");
    setStatusMessage("Campos limpos.");
  };

  return (
    <section className="card test-case-generator-page">
      <article className="test-case-generator-block">
        <h2>Test Case Generator</h2>
        <p className="test-case-generator-caption">
          IA local especializada para gerar casos de teste com saida JSON e Gherkin.
        </p>
        <p className="test-case-generator-scope-note">
          Fora desse contexto, ela responde como fora de escopo.
        </p>

        <label>
          Regra funcional
          <textarea
            rows={15}
            value={ruleText}
            onChange={(event) => setRuleText(event.target.value)}
            placeholder="Cole aqui a regra funcional"
          />
        </label>

        <label>
          Tipo de cobertura
          <select value={targetType} onChange={(event) => setTargetType(event.target.value)}>
            {TEST_CASE_TARGET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <strong className="test-case-generator-subtitle">Categorias</strong>
        <div className="test-case-generator-categories">
          {TEST_CASE_CATEGORY_OPTIONS.map((option) => (
            <label key={option.value} className="test-case-generator-checkbox">
              <input
                type="checkbox"
                checked={Boolean(enabledCategories[option.value])}
                onChange={() => toggleCategory(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>

        <div className="test-case-generator-actions">
          <button type="button" onClick={analyzeLocal}>Gerar com IA local</button>
          <button type="button" onClick={generateGherkin} disabled={generatedCases.length === 0}>Gerar Gherkin</button>
          <button type="button" onClick={clearAll}>Limpar</button>
        </div>

        {statusMessage && <p className="test-case-generator-message">{statusMessage}</p>}
      </article>

      <article className="test-case-generator-block">
        <div className="test-case-generator-output-header">
          <strong>Casos gerados ({generatedCases.length})</strong>
        </div>

        {Object.keys(caseCounters).length > 0 && (
          <div className="test-case-generator-summary">
            {Object.entries(caseCounters).map(([category, count]) => (
              <span key={category}>{category}: {count}</span>
            ))}
          </div>
        )}

        <div className="test-case-generator-output-group">
          <div className="test-case-generator-output-header">
            <strong>Casos (JSON)</strong>
            <button
              type="button"
              onClick={() => copyText(generatedCasesRaw, setStatusMessage, "JSON copiado.", "Nao ha JSON para copiar.")}
              disabled={!generatedCasesRaw}
            >
              Copiar
            </button>
          </div>
          <textarea rows={10} readOnly value={generatedCasesRaw} placeholder="Casos gerados em JSON" />
        </div>

        <div className="test-case-generator-output-group">
          <div className="test-case-generator-output-header">
            <strong>Gherkin</strong>
            <button
              type="button"
              onClick={() => copyText(gherkinOutput, setStatusMessage, "Gherkin copiado.", "Nao ha Gherkin para copiar.")}
              disabled={!gherkinOutput}
            >
              Copiar
            </button>
          </div>
          <textarea rows={12} readOnly value={gherkinOutput} placeholder="Feature/Scenario em Gherkin" />
        </div>
      </article>
    </section>
  );
}
