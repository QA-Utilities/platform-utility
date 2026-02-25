import { useState } from "react";
import "../styles/pages/file-tool-page.css";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FileToolPage() {
  const [filename, setFilename] = useState("evidencia.txt");
  const [fileContent, setFileContent] = useState("Cole aqui o conteudo do arquivo...");

  const createTextFile = () => {
    const safeName = filename?.trim() || "arquivo.txt";
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, safeName);
  };

  return (
    <section className="card file-tool-page">
      <h2>Criar Arquivo de Texto</h2>
      <label>
        Nome do arquivo
        <input value={filename} onChange={(e) => setFilename(e.target.value)} />
      </label>
      <label>
        Conteudo
        <textarea value={fileContent} onChange={(e) => setFileContent(e.target.value)} rows={10} />
      </label>
      <button type="button" onClick={createTextFile}>
        Baixar arquivo
      </button>
    </section>
  );
}