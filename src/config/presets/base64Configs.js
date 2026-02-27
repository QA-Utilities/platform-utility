export const MIME_EXTENSION_MAP = {
  "text/plain": "txt",
  "text/html": "html",
  "application/xml": "xml",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
  "application/json": "json",
  "application/zip": "zip",
  "application/gzip": "gz",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "video/mp4": "mp4",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp"
};

export const BYTE_SIGNATURES = [
  { mime: "application/pdf", signature: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  { mime: "image/png", signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
  { mime: "image/gif", signature: [0x47, 0x49, 0x46, 0x38] },
  { mime: "application/zip", signature: [0x50, 0x4b, 0x03, 0x04] },
  { mime: "application/zip", signature: [0x50, 0x4b, 0x05, 0x06] },
  { mime: "application/zip", signature: [0x50, 0x4b, 0x07, 0x08] },
  { mime: "application/gzip", signature: [0x1f, 0x8b] },
  { mime: "audio/mpeg", signature: [0x49, 0x44, 0x33] }
];

export const BINARY_DETECTION_CONFIG = {
  textSampleSize: 1024,
  textSuspiciousThreshold: 0.05,
  textDecodeBytes: 2048
};

export const DEFAULT_RECOVERED_FILENAME = "arquivo-recuperado";
