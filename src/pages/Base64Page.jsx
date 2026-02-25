import { useState } from "react";
import "../styles/pages/base64-page.css";

function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Falha ao ler o arquivo."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export default function Base64Page() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [base64Output, setBase64Output] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [includeDataUrl, setIncludeDataUrl] = useState(false);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setSelectedFile(nextFile);
    setBase64Output("");
    setStatusMessage(nextFile ? `Arquivo selecionado: ${nextFile.name}` : "");
  };

  const convertToBase64 = async () => {
    if (!selectedFile) {
      setStatusMessage("Selecione um arquivo primeiro.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(selectedFile);
      const rawBase64 = dataUrl.split(",")[1] || "";
      const output = includeDataUrl ? dataUrl : rawBase64;
      setBase64Output(output);
      setStatusMessage(`Arquivo convertido: ${selectedFile.name}`);
    } catch (error) {
      setStatusMessage(`Falha na conversao: ${error.message}`);
    }
  };

  const copyBase64 = async () => {
    if (!base64Output) {
      setStatusMessage("Nenhum conteudo Base64 para copiar.");
      return;
    }

    if (!navigator.clipboard) {
      setStatusMessage("Clipboard indisponivel neste navegador.");
      return;
    }

    try {
      await navigator.clipboard.writeText(base64Output);
      setStatusMessage("Base64 copiado para a area de transferencia.");
    } catch {
      setStatusMessage("Nao foi possivel copiar o Base64.");
    }
  };

  const downloadBase64 = () => {
    if (!base64Output) {
      setStatusMessage("Nenhum conteudo Base64 para baixar.");
      return;
    }

    const outputName = selectedFile ? `${selectedFile.name}.base64.txt` : "arquivo.base64.txt";
    downloadTextFile(base64Output, outputName);
    setStatusMessage(`Arquivo salvo: ${outputName}`);
  };

  return (
    <section className="card base64-page">
      <h2>Converter arquivo para Base64</h2>
      <p>Selecione um arquivo e gere o conteudo em Base64 para copiar ou baixar.</p>

      <input type="file" onChange={handleFileChange} />

      <label className="base64-option">
        <input
          type="checkbox"
          checked={includeDataUrl}
          onChange={(e) => setIncludeDataUrl(e.target.checked)}
        />
        Incluir prefixo data URL
      </label>

      <div className="base64-actions">
        <button type="button" onClick={convertToBase64}>
          Converter para Base64
        </button>
        <button type="button" onClick={copyBase64} disabled={!base64Output}>
          Copiar Base64
        </button>
        <button type="button" onClick={downloadBase64} disabled={!base64Output}>
          Baixar .txt
        </button>
      </div>

      {selectedFile && <small className="base64-file-info">Arquivo: {selectedFile.name}</small>}
      {base64Output && (
        <small className="base64-size">Tamanho do texto: {base64Output.length} caracteres</small>
      )}
      {statusMessage && <p className="base64-message">{statusMessage}</p>}

      <label className="base64-output">
        Resultado Base64
        <textarea rows={12} readOnly value={base64Output} />
      </label>
    </section>
  );
}
