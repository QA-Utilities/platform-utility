import { useState } from "react";
import QRCode from "qrcode";
import {
  QR_DOWNLOAD_FILENAME,
  QR_RENDER_OPTIONS,
  QR_TOKEN_ALPHABET,
  QR_TOKEN_LENGTH
} from "../config/presets/qrCodeConfigs";
import "../styles/pages/qrcode-page.css";

function randomToken(length) {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += QR_TOKEN_ALPHABET[Math.floor(Math.random() * QR_TOKEN_ALPHABET.length)];
  }
  return value;
}

function buildRandomPayload() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("");
  return `QA-QR-${stamp}-${randomToken(QR_TOKEN_LENGTH)}`;
}

async function createQrDataUrl(value) {
  return QRCode.toDataURL(value, QR_RENDER_OPTIONS);
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export default function QrCodePage() {
  const [qrValue, setQrValue] = useState("");
  const [qrImageDataUrl, setQrImageDataUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const generateFromValue = async (inputValue) => {
    const value = (inputValue || "").trim();
    if (!value) {
      setStatusMessage("Informe um conteudo para gerar o QR Code.");
      return;
    }

    try {
      const dataUrl = await createQrDataUrl(value);
      setQrImageDataUrl(dataUrl);
      setStatusMessage("QR Code gerado com sucesso.");
    } catch {
      setStatusMessage("Falha ao gerar o QR Code.");
    }
  };

  const generateRandomQr = async () => {
    const payload = buildRandomPayload();
    setQrValue(payload);
    await generateFromValue(payload);
  };

  const generateManualQr = async () => {
    await generateFromValue(qrValue);
  };

  const copyValue = async () => {
    if (!qrValue.trim()) {
      setStatusMessage("Nenhum conteudo para copiar.");
      return;
    }

    if (!navigator.clipboard) {
      setStatusMessage("Clipboard indisponivel neste navegador.");
      return;
    }

    try {
      await navigator.clipboard.writeText(qrValue);
      setStatusMessage("Conteudo do QR Code copiado.");
    } catch {
      setStatusMessage("Nao foi possivel copiar o conteudo.");
    }
  };

  const downloadQr = () => {
    if (!qrImageDataUrl) {
      setStatusMessage("Gere um QR Code antes de baixar.");
      return;
    }
    downloadDataUrl(qrImageDataUrl, QR_DOWNLOAD_FILENAME);
    setStatusMessage("QR Code baixado.");
  };

  return (
    <section className="card qrcode-page">
      <h2>Gerar QR Code</h2>
      <p className="qrcode-caption">Crie QR Codes aleatorios para testes de leitura e integracoes.</p>

      <label>
        Conteudo do QR Code
        <textarea
          rows={4}
          value={qrValue}
          onChange={(event) => setQrValue(event.target.value)}
          placeholder="Clique em Gerar QRCode aleatorio ou informe um conteudo"
        />
      </label>

      <div className="qrcode-actions">
        <button type="button" onClick={generateRandomQr}>
          Gerar QRCode aleatorio
        </button>
        <button type="button" onClick={generateManualQr} disabled={!qrValue.trim()}>
          Gerar com conteudo
        </button>
        <button type="button" onClick={copyValue} disabled={!qrValue.trim()}>
          Copiar conteudo
        </button>
      </div>

      {qrImageDataUrl && (
        <div className="qrcode-preview">
          <img src={qrImageDataUrl} alt={`QR Code: ${qrValue}`} />
          <button type="button" onClick={downloadQr}>
            Baixar PNG
          </button>
        </div>
      )}

      {statusMessage && <p className="qrcode-message">{statusMessage}</p>}
    </section>
  );
}
