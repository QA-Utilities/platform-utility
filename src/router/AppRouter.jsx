import { Navigate, Route, Routes } from "react-router-dom";
import Base64Page from "../pages/Base64Page";
import CompareJsonPage from "../pages/CompareJsonPage";
import ColorPickerPage from "../pages/ColorPickerPage";
import CompressPage from "../pages/CompressPage";
import FakeDataPage from "../pages/FakeDataPage";
import FileToolPage from "../pages/FileToolPage";
import HashHmacPage from "../pages/HashHmacPage";
import JsonToolPage from "../pages/JsonToolPage";
import JwtToolPage from "../pages/JwtToolPage";
import MockApiPage from "../pages/MockApiPage";
import QrCodePage from "../pages/QrCodePage";
import SecurityPayloadsPage from "../pages/SecurityPayloadsPage";
import StringToolPage from "../pages/StringToolPage";
import TestCaseGeneratorPage from "../pages/TestCaseGeneratorPage";
import WebhookSimulatorPage from "../pages/WebhookSimulatorPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<FileToolPage />} />
      <Route path="/json" element={<JsonToolPage />} />
      <Route path="/jwt" element={<JwtToolPage />} />
      <Route path="/hash-hmac" element={<HashHmacPage />} />
      <Route path="/mock-api" element={<MockApiPage />} />
      <Route path="/webhook-simulator" element={<WebhookSimulatorPage />} />
      <Route path="/comparar-valor" element={<CompareJsonPage />} />
      <Route path="/security-payloads" element={<SecurityPayloadsPage />} />
      <Route path="/test-case-generator" element={<TestCaseGeneratorPage />} />
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
