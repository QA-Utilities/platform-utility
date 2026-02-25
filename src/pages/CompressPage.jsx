import { useState } from "react";
import "../styles/pages/compress-page.css";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function gzipFile(file) {
  if (!("CompressionStream" in window)) {
    throw new Error("Seu navegador nao suporta CompressionStream.");
  }

  const stream = file.stream().pipeThrough(new CompressionStream("gzip"));
  return new Response(stream).blob();
}

export default function CompressPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [compressMessage, setCompressMessage] = useState("");

  const compressSelected = async () => {
    if (!selectedFile) {
      setCompressMessage("Selecione um arquivo primeiro.");
      return;
    }

    try {
      const gz = await gzipFile(selectedFile);
      downloadBlob(gz, `${selectedFile.name}.gz`);
      setCompressMessage(`Arquivo comprimido: ${selectedFile.name}.gz`);
    } catch (error) {
      setCompressMessage(`Falha ao comprimir: ${error.message}`);
    }
  };

  return (
    <section className="card compress-page">
      <h2>Comprimir arquivo (GZIP)</h2>
      <p>Ideal para anexos de log e evidencias grandes.</p>
      <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
      <button type="button" onClick={compressSelected}>
        Comprimir e baixar .gz
      </button>
      {compressMessage && <p>{compressMessage}</p>}
    </section>
  );
}