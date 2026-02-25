import { Navigate, Route, Routes } from "react-router-dom";
import Base64Page from "../pages/Base64Page";
import CompareJsonPage from "../pages/CompareJsonPage";
import CompressPage from "../pages/CompressPage";
import FileToolPage from "../pages/FileToolPage";
import JsonToolPage from "../pages/JsonToolPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<FileToolPage />} />
      <Route path="/json" element={<JsonToolPage />} />
      <Route path="/comparar-json" element={<CompareJsonPage />} />
      <Route path="/comprimir" element={<CompressPage />} />
      <Route path="/base64" element={<Base64Page />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
