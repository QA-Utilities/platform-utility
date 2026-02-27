import { useEffect, useMemo, useState } from "react";
import { COLOR_PICKER_INITIAL_INPUTS, COLOR_PICKER_INITIAL_RGB } from "../config/presets/colorPickerConfigs";
import "../styles/pages/color-picker-page.css";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toInt(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.round(parsed);
}

function componentToHex(value) {
  return value.toString(16).padStart(2, "0").toUpperCase();
}

function rgbToHex({ r, g, b }) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function hexToRgb(value) {
  const clean = (value || "").trim().replace(/^#/, "");
  if (!/^[\da-fA-F]{3}$|^[\da-fA-F]{6}$/.test(clean)) return null;

  const normalized =
    clean.length === 3 ? clean.split("").map((char) => `${char}${char}`).join("") : clean;

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToRgb({ h, s, l }) {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hn < 60) [r1, g1, b1] = [c, x, 0];
  else if (hn < 120) [r1, g1, b1] = [x, c, 0];
  else if (hn < 180) [r1, g1, b1] = [0, c, x];
  else if (hn < 240) [r1, g1, b1] = [0, x, c];
  else if (hn < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  return {
    r: clamp(Math.round((r1 + m) * 255), 0, 255),
    g: clamp(Math.round((g1 + m) * 255), 0, 255),
    b: clamp(Math.round((b1 + m) * 255), 0, 255)
  };
}

function rgbToHsv({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  };
}

function hsvToRgb({ h, s, v }) {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const vn = clamp(v, 0, 100) / 100;

  const c = vn * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = vn - c;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hn < 60) [r1, g1, b1] = [c, x, 0];
  else if (hn < 120) [r1, g1, b1] = [x, c, 0];
  else if (hn < 180) [r1, g1, b1] = [0, c, x];
  else if (hn < 240) [r1, g1, b1] = [0, x, c];
  else if (hn < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  return {
    r: clamp(Math.round((r1 + m) * 255), 0, 255),
    g: clamp(Math.round((g1 + m) * 255), 0, 255),
    b: clamp(Math.round((b1 + m) * 255), 0, 255)
  };
}

function rgbToCmyk({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);

  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };

  const c = (1 - rn - k) / (1 - k);
  const m = (1 - gn - k) / (1 - k);
  const y = (1 - bn - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
}

function cmykToRgb({ c, m, y, k }) {
  const cn = clamp(c, 0, 100) / 100;
  const mn = clamp(m, 0, 100) / 100;
  const yn = clamp(y, 0, 100) / 100;
  const kn = clamp(k, 0, 100) / 100;

  return {
    r: clamp(Math.round(255 * (1 - cn) * (1 - kn)), 0, 255),
    g: clamp(Math.round(255 * (1 - mn) * (1 - kn)), 0, 255),
    b: clamp(Math.round(255 * (1 - yn) * (1 - kn)), 0, 255)
  };
}

export default function ColorPickerPage() {
  const [rgb, setRgb] = useState({ ...COLOR_PICKER_INITIAL_RGB });
  const [rgbInput, setRgbInput] = useState({ ...COLOR_PICKER_INITIAL_INPUTS.rgb });
  const [hexInput, setHexInput] = useState(COLOR_PICKER_INITIAL_INPUTS.hex);
  const [hslInput, setHslInput] = useState({ ...COLOR_PICKER_INITIAL_INPUTS.hsl });
  const [hsvInput, setHsvInput] = useState({ ...COLOR_PICKER_INITIAL_INPUTS.hsv });
  const [cmykInput, setCmykInput] = useState({ ...COLOR_PICKER_INITIAL_INPUTS.cmyk });
  const [statusMessage, setStatusMessage] = useState("");

  const currentHex = useMemo(() => rgbToHex(rgb), [rgb]);

  useEffect(() => {
    const nextHsl = rgbToHsl(rgb);
    const nextHsv = rgbToHsv(rgb);
    const nextCmyk = rgbToCmyk(rgb);

    setRgbInput({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) });
    setHexInput(currentHex);
    setHslInput({ h: String(nextHsl.h), s: String(nextHsl.s), l: String(nextHsl.l) });
    setHsvInput({ h: String(nextHsv.h), s: String(nextHsv.s), v: String(nextHsv.v) });
    setCmykInput({
      c: String(nextCmyk.c),
      m: String(nextCmyk.m),
      y: String(nextCmyk.y),
      k: String(nextCmyk.k)
    });
  }, [rgb, currentHex]);

  const applyRgb = () => {
    setRgb({
      r: clamp(toInt(rgbInput.r), 0, 255),
      g: clamp(toInt(rgbInput.g), 0, 255),
      b: clamp(toInt(rgbInput.b), 0, 255)
    });
    setStatusMessage("Cor aplicada por RGB.");
  };

  const applyHex = () => {
    const parsed = hexToRgb(hexInput);
    if (!parsed) {
      setStatusMessage("HEX invalido. Use #RRGGBB ou #RGB.");
      return;
    }
    setRgb(parsed);
    setStatusMessage("Cor aplicada por HEX.");
  };

  const applyHsl = () => {
    setRgb(
      hslToRgb({
        h: toInt(hslInput.h),
        s: clamp(toInt(hslInput.s), 0, 100),
        l: clamp(toInt(hslInput.l), 0, 100)
      })
    );
    setStatusMessage("Cor aplicada por HSL.");
  };

  const applyHsv = () => {
    setRgb(
      hsvToRgb({
        h: toInt(hsvInput.h),
        s: clamp(toInt(hsvInput.s), 0, 100),
        v: clamp(toInt(hsvInput.v), 0, 100)
      })
    );
    setStatusMessage("Cor aplicada por HSV/HSB.");
  };

  const applyCmyk = () => {
    setRgb(
      cmykToRgb({
        c: clamp(toInt(cmykInput.c), 0, 100),
        m: clamp(toInt(cmykInput.m), 0, 100),
        y: clamp(toInt(cmykInput.y), 0, 100),
        k: clamp(toInt(cmykInput.k), 0, 100)
      })
    );
    setStatusMessage("Cor aplicada por CMYK.");
  };

  return (
    <section className="card color-picker-page">
      <h2>Color Picker</h2>
      <p className="color-picker-caption">Converta cores entre RGB, HEX, HSL, HSV/HSB e CMYK.</p>

      <div className="color-picker-preview" style={{ backgroundColor: currentHex }}>
        <div className="color-picker-preview-overlay">
          <code>{currentHex}</code>
          <input
            type="color"
            value={currentHex}
            onChange={(event) => {
              const parsed = hexToRgb(event.target.value);
              if (parsed) {
                setRgb(parsed);
                setStatusMessage("Cor aplicada pelo seletor.");
              }
            }}
            aria-label="Selecionar cor"
          />
        </div>
      </div>

      <div className="color-picker-grid">
        <article className="color-section">
          <h3>RGB (Red, Green, Blue - Vermelho, Verde, Azul)</h3>
          <div className="color-fields color-fields-3">
            <label>
              R (0-255)
              <input value={rgbInput.r} onChange={(event) => setRgbInput((c) => ({ ...c, r: event.target.value }))} />
            </label>
            <label>
              G (0-255)
              <input value={rgbInput.g} onChange={(event) => setRgbInput((c) => ({ ...c, g: event.target.value }))} />
            </label>
            <label>
              B (0-255)
              <input value={rgbInput.b} onChange={(event) => setRgbInput((c) => ({ ...c, b: event.target.value }))} />
            </label>
          </div>
          <button type="button" onClick={applyRgb}>Aplicar RGB</button>
        </article>

        <article className="color-section">
          <h3>Hexadecimal (HEX)</h3>
          <label>
            HEX
            <input value={hexInput} onChange={(event) => setHexInput(event.target.value)} placeholder="#RRGGBB" />
          </label>
          <button type="button" onClick={applyHex}>Aplicar HEX</button>
        </article>

        <article className="color-section">
          <h3>HSL (Hue, Saturation, Lightness - Matiz, Saturacao, Luminosidade)</h3>
          <div className="color-fields color-fields-3">
            <label>
              H (0-360)
              <input value={hslInput.h} onChange={(event) => setHslInput((c) => ({ ...c, h: event.target.value }))} />
            </label>
            <label>
              S (0-100%)
              <input value={hslInput.s} onChange={(event) => setHslInput((c) => ({ ...c, s: event.target.value }))} />
            </label>
            <label>
              L (0-100%)
              <input value={hslInput.l} onChange={(event) => setHslInput((c) => ({ ...c, l: event.target.value }))} />
            </label>
          </div>
          <button type="button" onClick={applyHsl}>Aplicar HSL</button>
        </article>

        <article className="color-section">
          <h3>HSV/HSB (Hue, Saturation, Value/Brightness)</h3>
          <div className="color-fields color-fields-3">
            <label>
              H (0-360)
              <input value={hsvInput.h} onChange={(event) => setHsvInput((c) => ({ ...c, h: event.target.value }))} />
            </label>
            <label>
              S (0-100%)
              <input value={hsvInput.s} onChange={(event) => setHsvInput((c) => ({ ...c, s: event.target.value }))} />
            </label>
            <label>
              V/B (0-100%)
              <input value={hsvInput.v} onChange={(event) => setHsvInput((c) => ({ ...c, v: event.target.value }))} />
            </label>
          </div>
          <button type="button" onClick={applyHsv}>Aplicar HSV/HSB</button>
        </article>

        <article className="color-section color-section-wide">
          <h3>CMYK (Cyan, Magenta, Yellow, Key/Black - Ciano, Magenta, Amarelo, Preto)</h3>
          <div className="color-fields color-fields-4">
            <label>
              C (0-100%)
              <input value={cmykInput.c} onChange={(event) => setCmykInput((c) => ({ ...c, c: event.target.value }))} />
            </label>
            <label>
              M (0-100%)
              <input value={cmykInput.m} onChange={(event) => setCmykInput((c) => ({ ...c, m: event.target.value }))} />
            </label>
            <label>
              Y (0-100%)
              <input value={cmykInput.y} onChange={(event) => setCmykInput((c) => ({ ...c, y: event.target.value }))} />
            </label>
            <label>
              K (0-100%)
              <input value={cmykInput.k} onChange={(event) => setCmykInput((c) => ({ ...c, k: event.target.value }))} />
            </label>
          </div>
          <button type="button" onClick={applyCmyk}>Aplicar CMYK</button>
        </article>
      </div>

      {statusMessage && <p className="color-picker-message">{statusMessage}</p>}
    </section>
  );
}
