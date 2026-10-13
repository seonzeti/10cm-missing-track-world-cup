// api/_lib/http.js
// API 응답 헬퍼

export function sendJson(res, statusCode, data, headers = {}) {
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  return res.status(statusCode).json(data);
}

export function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ error: message });
}
