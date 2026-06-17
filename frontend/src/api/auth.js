const BASE = "http://localhost:8001";

const headers = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// ── Auth ──────────────────────────────────────────────
export async function registerUser(data) {
  const res = await fetch(`${BASE}/auth/user/register`, {
    method: "POST", headers: headers(), body: JSON.stringify(data),
  });
  return res.json();
}

export async function loginUser(data) {
  const res = await fetch(`${BASE}/auth/user/login`, {
    method: "POST", headers: headers(), body: JSON.stringify(data),
  });
  return res.json();
}

export async function registerDoctor(data) {
  const res = await fetch(`${BASE}/auth/doctor/register`, {
    method: "POST", headers: headers(), body: JSON.stringify(data),
  });
  return res.json();
}

export async function loginDoctor(data) {
  const res = await fetch(`${BASE}/auth/doctor/login`, {
    method: "POST", headers: headers(), body: JSON.stringify(data),
  });
  return res.json();
}

// ── Reports ───────────────────────────────────────────
export async function saveReport(token, data) {
  const res = await fetch(`${BASE}/reports`, {
    method: "POST", headers: headers(token), body: JSON.stringify(data),
  });
  return res.json();
}

export async function getMyReports(token) {
  const res = await fetch(`${BASE}/reports/my`, { headers: headers(token) });
  return res.json();
}

export async function getReport(token, id) {
  const res = await fetch(`${BASE}/reports/${id}`, { headers: headers(token) });
  return res.json();
}

// ── Consultations ─────────────────────────────────────
export async function requestConsultation(token, data) {
  const res = await fetch(`${BASE}/consultations/request`, {
    method: "POST", headers: headers(token), body: JSON.stringify(data),
  });
  return res.json();
}

export async function getMyConsultations(token) {
  const res = await fetch(`${BASE}/consultations/my`, { headers: headers(token) });
  return res.json();
}

export async function getDoctorDashboard(token) {
  const res = await fetch(`${BASE}/consultations/dashboard`, { headers: headers(token) });
  return res.json();
}

export async function acceptConsultation(token, id) {
  const res = await fetch(`${BASE}/consultations/${id}/accept`, {
    method: "PATCH", headers: headers(token),
  });
  return res.json();
}

export async function sendPrescription(token, id, prescription) {
  const res = await fetch(`${BASE}/consultations/${id}/prescribe`, {
    method: "PATCH", headers: headers(token), body: JSON.stringify({ prescription }),
  });
  return res.json();
}

export async function getConsultation(token, id) {
  const res = await fetch(`${BASE}/consultations/${id}`, { headers: headers(token) });
  return res.json();
}

// ── Messages ──────────────────────────────────────────
export async function sendMessage(token, consultationId, text) {
  const res = await fetch(`${BASE}/messages`, {
    method: "POST", headers: headers(token),
    body: JSON.stringify({ consultationId, text }),
  });
  return res.json();
}

export async function getMessages(token, consultationId) {
  const res = await fetch(`${BASE}/messages/${consultationId}`, { headers: headers(token) });
  return res.json();
}

// ── Prescription PDF ──────────────────────────────────
export async function downloadPrescriptionPDF(token, consultationId) {
  const res = await fetch(`${BASE}/consultations/${consultationId}/prescription-pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to generate PDF");
  const blob = await res.blob();
  const url  = window.URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `prescription_${consultationId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
