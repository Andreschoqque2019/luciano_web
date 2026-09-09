export const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000');

export async function crearSolicitud(payload) {
  const res = await fetch(`${API_BASE}/api/solicitudes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || data.message || `Error ${res.status}`;
    const details = data.details ? `: ${data.details.join(', ')}` : '';
    throw new Error(msg + details);
  }
  return data;
}

export async function getSolicitudes(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API_BASE}/api/solicitudes${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function getSolicitudesAdmin(password, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API_BASE}/api/solicitudes${qs ? `?${qs}` : ''}`;
  const headers = {};
  if (password) headers['x-admin-password'] = password;
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || data.message || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function actualizarEstadoSolicitud(id, password, status = 'terminada') {
  const url = `${API_BASE}/api/solicitudes/${id}`;
  const headers = { 'Content-Type': 'application/json' };
  if (password) headers['x-admin-password'] = password;
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || data.message || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
