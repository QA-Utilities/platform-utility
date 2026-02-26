import { useEffect, useRef, useState } from "react";
import {
  CARD_BRANDS,
  COMPANY_PRESETS,
  LABEL_OVERRIDES,
  PERSON_PRESETS,
  VEHICLE_PRESETS
} from "../config/presets/fakeDataPresets";
import "../styles/pages/fake-data-page.css";

const VIN_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALPHA_NUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

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

function randomLetters(length) {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += LETTERS[randomInt(0, LETTERS.length - 1)];
  }
  return value;
}

function randomAlphaNumeric(length) {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += ALPHA_NUM[randomInt(0, ALPHA_NUM.length - 1)];
  }
  return value;
}

function randomVin() {
  let value = "";
  for (let i = 0; i < 17; i += 1) {
    value += VIN_CHARS[randomInt(0, VIN_CHARS.length - 1)];
  }
  return value;
}

function buildCpf() {
  const baseDigits = [];
  for (let i = 0; i < 9; i += 1) {
    baseDigits.push(randomInt(0, 9));
  }

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += baseDigits[i] * (10 - i);
  }
  const firstCheck = ((sum * 10) % 11) % 10;

  sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += baseDigits[i] * (11 - i);
  }
  sum += firstCheck * 2;
  const secondCheck = ((sum * 10) % 11) % 10;

  const cpf = `${baseDigits.join("")}${firstCheck}${secondCheck}`;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

function buildRg() {
  const body = randomDigits(8);
  const suffix = randomInt(0, 10) === 10 ? "X" : String(randomInt(0, 9));
  return `${body.slice(0, 2)}.${body.slice(2, 5)}.${body.slice(5, 8)}-${suffix}`;
}

function buildNif() {
  const baseDigits = [randomInt(1, 9)];
  for (let i = 0; i < 7; i += 1) {
    baseDigits.push(randomInt(0, 9));
  }

  let sum = 0;
  for (let i = 0; i < 8; i += 1) {
    sum += baseDigits[i] * (9 - i);
  }

  const checkRaw = 11 - (sum % 11);
  const checkDigit = checkRaw >= 10 ? 0 : checkRaw;
  return `${baseDigits.join("")}${checkDigit}`;
}

function buildNiss() {
  const firstDigit = randomInt(1, 9);
  return `${firstDigit}${randomDigits(10)}`;
}

function buildPortugueseCitizenCard() {
  return `${randomDigits(8)} ${randomDigits(1)} ${randomLetters(2)}${randomDigits(1)}`;
}

function buildSsn() {
  let area = randomInt(1, 899);
  while (area === 666) {
    area = randomInt(1, 899);
  }
  const group = randomInt(1, 99);
  const serial = randomInt(1, 9999);

  return `${String(area).padStart(3, "0")}-${String(group).padStart(2, "0")}-${String(serial).padStart(4, "0")}`;
}

function buildUsDriverLicense(state) {
  return `${state}-${randomAlphaNumeric(8)}`;
}

function normalizeNameForEmail(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, ".");
}

function buildPerson(country) {
  const preset = PERSON_PRESETS[country];
  const firstName = randomItem(preset.firstNames);
  const middleLast = randomItem(preset.lastNames);
  const lastName = randomItem(preset.lastNames);
  const fullName = `${firstName} ${middleLast} ${lastName}`;
  const emailBase = normalizeNameForEmail(fullName);
  const email = `${emailBase}${randomInt(10, 99)}@${randomItem(preset.domains)}`;

  if (country === "br") {
    const cep = `${randomDigits(5)}-${randomDigits(3)}`;
    const ddd = randomInt(11, 99);
    return {
      nome_completo: fullName,
      email,
      endereco: `${randomItem(preset.streets)}, ${randomInt(10, 9999)} - ${randomItem(preset.districts)}, ${randomItem(
        preset.cities
      )}/${randomItem(preset.states)}`,
      cep,
      pais: preset.label,
      telefone: `+55 (${ddd}) 9${randomDigits(4)}-${randomDigits(4)}`,
      identificadores: {
        cpf: buildCpf(),
        rg: buildRg(),
        cnh: randomDigits(11)
      }
    };
  }

  if (country === "pt") {
    const cep = `${randomDigits(4)}-${randomDigits(3)}`;
    return {
      nome_completo: fullName,
      email,
      endereco: `${randomItem(preset.streets)}, ${randomInt(1, 300)}, ${cep} ${randomItem(preset.cities)}`,
      cep,
      pais: preset.label,
      telefone: `+351 9${randomDigits(2)} ${randomDigits(3)} ${randomDigits(3)}`,
      identificadores: {
        nif: buildNif(),
        niss: buildNiss(),
        cartao_cidadao: buildPortugueseCitizenCard()
      }
    };
  }

  const cep = randomDigits(5);
  const state = randomItem(preset.states);
  return {
    nome_completo: fullName,
    email,
    endereco: `${randomInt(10, 9999)} ${randomItem(preset.streets)}, ${randomItem(preset.cities)}, ${state} ${cep}`,
    cep,
    pais: preset.label,
    telefone: `+1 (${randomDigits(3)}) ${randomDigits(3)}-${randomDigits(4)}`,
    identificadores: {
      ssn: buildSsn(),
      driver_license: buildUsDriverLicense(state)
    }
  };
}

function luhnCheckDigit(numberWithoutCheck) {
  let sum = 0;
  const reversed = numberWithoutCheck.split("").reverse();

  reversed.forEach((char, index) => {
    let digit = Number(char);
    if (index % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  });

  return String((10 - (sum % 10)) % 10);
}

function formatCardNumber(number) {
  if (number.length === 15) {
    return `${number.slice(0, 4)} ${number.slice(4, 10)} ${number.slice(10)}`;
  }
  return number.match(/.{1,4}/g)?.join(" ") || number;
}

function buildCard(brandKey) {
  const brand = CARD_BRANDS[brandKey];
  const prefix = randomItem(brand.prefixes);
  const body = `${prefix}${randomDigits(brand.length - prefix.length - 1)}`;
  const checkDigit = luhnCheckDigit(body);
  const cardNumber = `${body}${checkDigit}`;

  const month = String(randomInt(1, 12)).padStart(2, "0");
  const year = String((new Date().getFullYear() + randomInt(1, 6)) % 100).padStart(2, "0");

  return {
    bandeira: brand.label,
    numero_cartao: formatCardNumber(cardNumber),
    validade: `${month}/${year}`,
    cvv: randomDigits(brand.cvvLength)
  };
}

function buildBrazilPlate() {
  return `${randomLetters(3)}${randomDigits(1)}${randomLetters(1)}${randomDigits(2)}`;
}

function buildPortugalPlate() {
  return `${randomLetters(2)}-${randomDigits(2)}-${randomLetters(2)}`;
}

function buildUsPlate() {
  return `${randomLetters(3)}-${randomDigits(4)}`;
}

function buildVehicle(country) {
  const preset = VEHICLE_PRESETS[country];
  const brands = Object.keys(preset.brands);
  const brand = randomItem(brands);
  const model = randomItem(preset.brands[brand]);
  const year = randomInt(2005, new Date().getFullYear() + 1);
  const color = randomItem(preset.colors);

  if (country === "br") {
    return {
      pais: preset.label,
      marca: brand,
      modelo: model,
      ano: year,
      cor: color,
      identificadores: {
        placa: buildBrazilPlate(),
        renavam: randomDigits(11)
      }
    };
  }

  if (country === "pt") {
    return {
      pais: preset.label,
      marca: brand,
      modelo: model,
      ano: year,
      cor: color,
      identificadores: {
        matricula: buildPortugalPlate(),
        vin: randomVin()
      }
    };
  }

  return {
    pais: preset.label,
    marca: brand,
    modelo: model,
    ano: year,
    cor: color,
    identificadores: {
      license_plate: buildUsPlate(),
      vin: randomVin()
    }
  };
}

function formatDateIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function randomDateFromYearRange(startYear, endYear) {
  const year = randomInt(startYear, endYear);
  const month = randomInt(0, 11);
  const day = randomInt(1, 28);
  return new Date(year, month, day);
}

function addMonths(date, monthsToAdd) {
  const result = new Date(date.getTime());
  result.setMonth(result.getMonth() + monthsToAdd);
  return result;
}

function buildBrazilCnpj() {
  const base = [];
  for (let i = 0; i < 8; i += 1) {
    base.push(randomInt(0, 9));
  }
  base.push(0, 0, 0, 1);

  const weight1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weight2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += base[i] * weight1[i];
  }
  const check1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  const baseWithFirst = [...base, check1];
  sum = 0;
  for (let i = 0; i < 13; i += 1) {
    sum += baseWithFirst[i] * weight2[i];
  }
  const check2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  const allDigits = `${base.join("")}${check1}${check2}`;
  return `${allDigits.slice(0, 2)}.${allDigits.slice(2, 5)}.${allDigits.slice(5, 8)}/${allDigits.slice(
    8,
    12
  )}-${allDigits.slice(12)}`;
}

function buildPortugalNipc() {
  const base = [5];
  for (let i = 0; i < 7; i += 1) {
    base.push(randomInt(0, 9));
  }

  let sum = 0;
  for (let i = 0; i < 8; i += 1) {
    sum += base[i] * (9 - i);
  }
  const checkRaw = 11 - (sum % 11);
  const checkDigit = checkRaw >= 10 ? 0 : checkRaw;

  return `${base.join("")}${checkDigit}`;
}

function buildUsEin() {
  return `${randomDigits(2)}-${randomDigits(7)}`;
}

function buildBrazilStateRegistration() {
  return randomDigits(12);
}

function buildPortugalCommercialRegistration() {
  return `CRC ${randomDigits(8)}`;
}

function buildUsStateTaxId(state) {
  return `${state}-${randomDigits(7)}`;
}

function buildCompany(country) {
  const preset = COMPANY_PRESETS[country];
  const prefix = randomItem(preset.prefixes);
  const core = randomItem(preset.cores);
  const suffix = randomItem(preset.suffixes);
  const companyName = `${prefix} ${core} ${suffix}`;
  const emailToken = normalizeNameForEmail(`${prefix} ${core}`).replace(/\./g, "");
  const email = `${emailToken || "empresa"}${randomInt(10, 99)}@${randomItem(preset.domains)}`;
  const foundationDate = randomDateFromYearRange(1975, 2020);
  const openingDate = addMonths(foundationDate, randomInt(1, 24));

  if (country === "br") {
    const state = randomItem(preset.states);
    return {
      pais: preset.label,
      nome_empresa: companyName,
      cnpj: buildBrazilCnpj(),
      tipo_documento_empresa: "CNPJ",
      data_fundacao: formatDateIso(foundationDate),
      localizacao: `${randomItem(preset.streets)}, ${randomInt(10, 9999)} - ${randomItem(preset.cities)}/${state}, Brasil`,
      data_abertura: formatDateIso(openingDate),
      inscricao_estadual: buildBrazilStateRegistration(),
      tipo_inscricao_estadual: "Inscricao Estadual",
      email
    };
  }

  if (country === "pt") {
    return {
      pais: preset.label,
      nome_empresa: companyName,
      cnpj: buildPortugalNipc(),
      tipo_documento_empresa: "NIPC (equivalente ao CNPJ)",
      data_fundacao: formatDateIso(foundationDate),
      localizacao: `${randomItem(preset.streets)}, ${randomInt(1, 300)}, ${randomDigits(4)}-${randomDigits(
        3
      )} ${randomItem(preset.cities)}, Portugal`,
      data_abertura: formatDateIso(openingDate),
      inscricao_estadual: buildPortugalCommercialRegistration(),
      tipo_inscricao_estadual: "Registo Comercial",
      email
    };
  }

  const state = randomItem(preset.states);
  return {
    pais: preset.label,
    nome_empresa: companyName,
    cnpj: buildUsEin(),
    tipo_documento_empresa: "EIN (equivalente ao CNPJ)",
    data_fundacao: formatDateIso(foundationDate),
    localizacao: `${randomInt(10, 9999)} ${randomItem(preset.streets)}, ${randomItem(
      preset.cities
    )}, ${state} ${randomDigits(5)}, USA`,
    data_abertura: formatDateIso(openingDate),
    inscricao_estadual: buildUsStateTaxId(state),
    tipo_inscricao_estadual: "State Tax ID",
    email
  };
}

function formatFieldLabel(key) {
  return key
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toFieldList(value, path = "") {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, nestedValue]) => {
      const nextPath = path ? `${path}.${key}` : key;
      return toFieldList(nestedValue, nextPath);
    });
  }

  const leafKey = path.split(".").pop() || path;
  const label = LABEL_OVERRIDES[path] || LABEL_OVERRIDES[leafKey] || formatFieldLabel(leafKey);
  return [{ id: path, label, value: String(value ?? "") }];
}

function DataFields({ fields, emptyMessage, onFieldCopy }) {
  if (fields.length === 0) {
    return <p className="fake-data-empty">{emptyMessage}</p>;
  }

  return (
    <div className="fake-data-fields">
      {fields.map((field, index) => (
        <label className="fake-data-field" key={`${field.id}-${index}`}>
          {field.label}
          <input
            type="text"
            readOnly
            value={field.value}
            title="Clique para copiar"
            onClick={(event) => {
              event.currentTarget.select();
              onFieldCopy(field);
            }}
          />
        </label>
      ))}
    </div>
  );
}

async function copyToClipboard(content, notify, emptyMessage, successMessage) {
  if (!content) {
    notify(emptyMessage);
    return;
  }

  if (!navigator.clipboard) {
    notify("Clipboard indisponivel neste navegador.");
    return;
  }

  try {
    await navigator.clipboard.writeText(content);
    notify(successMessage);
  } catch {
    notify("Nao foi possivel copiar o conteudo.");
  }
}

async function copyFieldValue(field, notify) {
  if (!field?.value) {
    notify("Campo vazio para copiar.");
    return;
  }

  if (!navigator.clipboard) {
    notify("Clipboard indisponivel neste navegador.");
    return;
  }

  try {
    await navigator.clipboard.writeText(field.value);
    notify(`${field.label} copiado.`);
  } catch {
    notify("Nao foi possivel copiar o campo.");
  }
}

export default function FakeDataPage() {
  const [personCountry, setPersonCountry] = useState("br");
  const [personOutput, setPersonOutput] = useState(null);

  const [cardBrand, setCardBrand] = useState("visa");
  const [cardOutput, setCardOutput] = useState(null);

  const [companyCountry, setCompanyCountry] = useState("br");
  const [companyOutput, setCompanyOutput] = useState(null);

  const [vehicleCountry, setVehicleCountry] = useState("br");
  const [vehicleOutput, setVehicleOutput] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef(null);

  const showToast = (message) => {
    if (!message) return;
    setToastMessage(message);

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage("");
      toastTimerRef.current = null;
    }, 2200);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const personFields = personOutput ? toFieldList(personOutput) : [];
  const cardFields = cardOutput ? toFieldList(cardOutput) : [];
  const companyFields = companyOutput ? toFieldList(companyOutput) : [];
  const vehicleFields = vehicleOutput ? toFieldList(vehicleOutput) : [];

  const generatePerson = () => {
    const data = buildPerson(personCountry);
    setPersonOutput(data);
    showToast(`Pessoa fake gerada para ${PERSON_PRESETS[personCountry].label}.`);
  };

  const generateCard = () => {
    const data = buildCard(cardBrand);
    setCardOutput(data);
    showToast(`Cartao ${CARD_BRANDS[cardBrand].label} gerado.`);
  };

  const generateCompany = () => {
    const data = buildCompany(companyCountry);
    setCompanyOutput(data);
    showToast(`Empresa fake gerada para ${COMPANY_PRESETS[companyCountry].label}.`);
  };

  const generateVehicle = () => {
    const data = buildVehicle(vehicleCountry);
    setVehicleOutput(data);
    showToast(`Veiculo fake gerado para ${VEHICLE_PRESETS[vehicleCountry].label}.`);
  };

  return (
    <section className="card fake-data-page">
      <h2>Gerador de dados fakes</h2>
      <p className="fake-data-intro">
        Gere dados ficticios para testes de cadastro, pagamentos e identificadores de veiculos.
      </p>
      {toastMessage && (
        <div className="fake-data-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      <div className="fake-data-grid">
        <article className="fake-data-block">
          <h3>Criar pessoa</h3>
          <label>
            Pais
            <select value={personCountry} onChange={(event) => setPersonCountry(event.target.value)}>
              {Object.entries(PERSON_PRESETS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>

          <p className="fake-data-tip">
            Identificadores: Brasil (CPF, RG e CNH), Portugal (NIF, NISS e Cartao de Cidadao), EUA (SSN e Driver
            License).
          </p>

          <div className="fake-data-actions">
            <button type="button" onClick={generatePerson}>
              Gerar pessoa
            </button>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  personOutput ? JSON.stringify(personOutput, null, 2) : "",
                  showToast,
                  "Gere uma pessoa primeiro.",
                  "JSON de pessoa copiado."
                )
              }
              disabled={!personOutput}
            >
              Copiar JSON
            </button>
          </div>
          <DataFields
            fields={personFields}
            emptyMessage="Gere uma pessoa para ver os campos separados."
            onFieldCopy={(field) => copyFieldValue(field, showToast)}
          />
        </article>

        <article className="fake-data-block">
          <h3>Criar cartao de credito</h3>
          <label>
            Bandeira
            <select value={cardBrand} onChange={(event) => setCardBrand(event.target.value)}>
              {Object.entries(CARD_BRANDS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>

          <div className="fake-data-actions">
            <button type="button" onClick={generateCard}>
              Gerar cartao
            </button>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  cardOutput ? JSON.stringify(cardOutput, null, 2) : "",
                  showToast,
                  "Gere um cartao primeiro.",
                  "JSON do cartao copiado."
                )
              }
              disabled={!cardOutput}
            >
              Copiar JSON
            </button>
          </div>
          <DataFields
            fields={cardFields}
            emptyMessage="Gere um cartao para ver os campos separados."
            onFieldCopy={(field) => copyFieldValue(field, showToast)}
          />
        </article>

        <article className="fake-data-block">
          <h3>Criar veiculo por pais</h3>
          <label>
            Pais
            <select value={vehicleCountry} onChange={(event) => setVehicleCountry(event.target.value)}>
              {Object.entries(VEHICLE_PRESETS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>

          <p className="fake-data-tip">
            Identificadores: Brasil (placa + renavam), Portugal (matricula + vin) e EUA (license plate + vin).
          </p>

          <div className="fake-data-actions">
            <button type="button" onClick={generateVehicle}>
              Gerar veiculo
            </button>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  vehicleOutput ? JSON.stringify(vehicleOutput, null, 2) : "",
                  showToast,
                  "Gere um veiculo primeiro.",
                  "JSON do veiculo copiado."
                )
              }
              disabled={!vehicleOutput}
            >
              Copiar JSON
            </button>
          </div>
          <DataFields
            fields={vehicleFields}
            emptyMessage="Gere um veiculo para ver os campos separados."
            onFieldCopy={(field) => copyFieldValue(field, showToast)}
          />
        </article>

        <article className="fake-data-block">
          <h3>Criar empresa</h3>
          <label>
            Pais
            <select value={companyCountry} onChange={(event) => setCompanyCountry(event.target.value)}>
              {Object.entries(COMPANY_PRESETS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>

          <p className="fake-data-tip">
            CNPJ e inscricao estadual sao convertidos para equivalentes locais: NIPC/Registo Comercial (Portugal) e
            EIN/State Tax ID (EUA).
          </p>

          <div className="fake-data-actions">
            <button type="button" onClick={generateCompany}>
              Gerar empresa
            </button>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  companyOutput ? JSON.stringify(companyOutput, null, 2) : "",
                  showToast,
                  "Gere uma empresa primeiro.",
                  "JSON da empresa copiado."
                )
              }
              disabled={!companyOutput}
            >
              Copiar JSON
            </button>
          </div>
          <DataFields
            fields={companyFields}
            emptyMessage="Gere uma empresa para ver os campos separados."
            onFieldCopy={(field) => copyFieldValue(field, showToast)}
          />
        </article>
      </div>
    </section>
  );
}
