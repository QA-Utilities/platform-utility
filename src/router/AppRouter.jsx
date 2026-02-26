import { Navigate, Route, Routes } from "react-router-dom";
import Base64Page from "../pages/Base64Page";
import CompareJsonPage from "../pages/CompareJsonPage";
import ColorPickerPage from "../pages/ColorPickerPage";
import CompressPage from "../pages/CompressPage";
import FakeDataPage from "../pages/FakeDataPage";
import FileToolPage from "../pages/FileToolPage";
import JsonToolPage from "../pages/JsonToolPage";
import QrCodePage from "../pages/QrCodePage";
import StringToolPage from "../pages/StringToolPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<FileToolPage />} />
      <Route path="/json" element={<JsonToolPage />} />
      <Route path="/comparar-valor" element={<CompareJsonPage />} />
      <Route path="/color-picker" element={<ColorPickerPage />} />
      <Route path="/comprimir" element={<CompressPage />} />
      <Route path="/base64" element={<Base64Page />} />
      <Route path="/qrcode" element={<QrCodePage />} />
      <Route path="/string" element={<StringToolPage />} />
      <Route path="/dados-fake" element={<FakeDataPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
