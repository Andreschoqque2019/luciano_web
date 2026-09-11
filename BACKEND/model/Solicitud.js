const { ObjectId } = require("mongodb");
const { getDb } = require("../Config/db");

const TIPOS_VALIDOS = ["pase", "orbes", "esencias", "comidas", "gemas", "otro", "alfalfa del dia peruano", "orbis del alfafa"];
const PAISES_VALIDOS = ["Perú", "México", "Argentina", "Venezuela", "Ecuador", "Colombia"];
const PAGOS_POR_PAIS = {
  "Perú": ["Yape", "Binance", "Astropay"],
  "México": ["Mercado Pago México", "Binance", "Astropay"],
  "Argentina": ["Mercado Pago Argentina", "Binance", "Astropay"],
  "Venezuela": ["Pago móvil Venezuela", "Binance", "Astropay"],
  "Ecuador": ["Banco Pichincha", "Binance", "Astropay"],
  "Colombia": ["Nequi", "Binance", "Astropay"],
};
const TODOS_METODOS = [...new Set(Object.values(PAGOS_POR_PAIS).flat())];
const PREFIJOS = {
  "Perú": "+51",
  "México": "+52",
  "Argentina": "+54",
  "Venezuela": "+58",
  "Ecuador": "+593",
  "Colombia": "+57",
};
const WHATSAPP_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;
const WHATSAPP_WITH_PREFIX = /^\+[0-9]{7,15}$/;
const WHATSAPP_LOCAL_PATTERN = /^[0-9]{7,12}$/;

function normalizeWasap(numero_wasap, pais) {
  if (!numero_wasap || typeof numero_wasap !== "string") return numero_wasap;
  let raw = numero_wasap.trim().replace(/[\s\-()]/g, "");
  if (!raw) return raw;
  if (raw.startsWith("+")) return raw;
  if (raw.startsWith("00")) return `+${raw.slice(2)}`;
  const prefijo = PREFIJOS[pais] || "";
  if (prefijo) return `${prefijo}${raw}`;
  return `+${raw}`;
}

function validateSolicitud({ tipo, pais, metodoPago, numero_wasap, nota_adicional, cantidad }) {
  const errors = [];
  if (!tipo || typeof tipo !== "string" || !TIPOS_VALIDOS.includes(tipo)) {
    errors.push(`tipo es requerido y debe ser uno de: ${TIPOS_VALIDOS.join(", ")}`);
  }
  if (!pais || typeof pais !== "string" || !PAISES_VALIDOS.includes(pais)) {
    errors.push(`pais es requerido y debe ser uno de: ${PAISES_VALIDOS.join(", ")}`);
  }
  if (!metodoPago || typeof metodoPago !== "string") {
    errors.push("metodoPago es requerido");
  } else if (pais && PAISES_VALIDOS.includes(pais)) {
    const metodosDelPais = PAGOS_POR_PAIS[pais] || [];
    if (!metodosDelPais.includes(metodoPago) && !TODOS_METODOS.includes(metodoPago)) {
      errors.push(`metodoPago "${metodoPago}" no es válido para el país "${pais}"`);
    }
  } else if (!TODOS_METODOS.includes(metodoPago)) {
    errors.push(`metodoPago "${metodoPago}" no es válido`);
  }
  // cantidad: required, integer >=1 (sin límite máximo)
  if (cantidad === undefined || cantidad === null || String(cantidad).trim() === "") {
    errors.push("cantidad es requerida y debe ser un entero mayor o igual a 1");
  } else {
    const num = Number(cantidad);
    if (!Number.isInteger(num) || num < 1) {
      errors.push("cantidad debe ser un entero mayor o igual a 1");
    }
  }
  if (!numero_wasap || typeof numero_wasap !== "string" || !numero_wasap.trim()) {
    errors.push("numero_wasap es requerido");
  } else {
    const trimmed = numero_wasap.trim().replace(/[\s\-()]/g, "");
    if (trimmed.startsWith("+")) {
      if (!WHATSAPP_WITH_PREFIX.test(trimmed)) {
        errors.push("numero_wasap formato inválido. Use ^\\+[0-9]{7,15}$");
      }
    } else if (trimmed.startsWith("00")) {
      const withPlus = `+${trimmed.slice(2)}`;
      if (!WHATSAPP_WITH_PREFIX.test(withPlus)) {
        errors.push("numero_wasap formato inválido. Use ^\\+[0-9]{7,15}$");
      }
    } else {
      // Sin prefijo: validar local 7-12, pero también aceptar si luego se normalizará con prefijo
      // Para no romper compatibilidad, si pais tiene prefijo, validar que local 7-12; si no pais, validar full
      if (!WHATSAPP_LOCAL_PATTERN.test(trimmed) && !WHATSAPP_WITH_PREFIX.test(`+${trimmed}`)) {
        errors.push("numero_wasap debe tener entre 7 y 12 dígitos (sin prefijo) o formato +[0-9]{7,15}");
      }
    }
  }
  if (nota_adicional !== undefined && nota_adicional !== null && nota_adicional !== "") {
    if (typeof nota_adicional !== "string") {
      errors.push("nota_adicional debe ser texto");
    } else if (nota_adicional.length > 500) {
      errors.push("nota_adicional no puede exceder los 500 caracteres");
    }
  }
  return errors;
}

async function createSolicitud({ tipo, pais, metodoPago, numero_wasap, nota_adicional, cantidad }) {
  // Normalizar numero_wasap con prefijo si falta y pais está presente
  let wasapNormalized = numero_wasap;
  if (typeof numero_wasap === "string" && numero_wasap.trim()) {
    const raw = numero_wasap.trim().replace(/[\s\-()]/g, "");
    if (!raw.startsWith("+") && !raw.startsWith("00")) {
      wasapNormalized = normalizeWasap(numero_wasap, pais);
    } else if (raw.startsWith("00")) {
      wasapNormalized = `+${raw.slice(2)}`;
    } else {
      wasapNormalized = raw;
    }
  }

  const errors = validateSolicitud({ tipo, pais, metodoPago, numero_wasap: wasapNormalized, nota_adicional, cantidad });
  if (errors.length > 0) {
    const err = new Error(errors.join("; "));
    err.status = 400;
    err.details = errors;
    throw err;
  }

  const db = getDb();
  const doc = {
    tipo: tipo.trim ? tipo.trim() : tipo,
    pais: pais.trim ? pais.trim() : pais,
    metodoPago: metodoPago.trim ? metodoPago.trim() : metodoPago,
    numero_wasap: wasapNormalized.trim(),
    cantidad: Number(cantidad),
    nota_adicional: nota_adicional ? String(nota_adicional).trim() : "",
    status: "pendiente",
    createdAt: new Date(),
  };

  const result = await db.collection("Solicitudes").insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

async function getSolicitudes(filter = {}) {
  const db = getDb();
  const query = {};
  if (filter.pais) query.pais = filter.pais;
  if (filter.tipo) query.tipo = filter.tipo;
  return await db.collection("Solicitudes").find(query).sort({ createdAt: -1 }).toArray();
}

async function getSolicitudById(id) {
  if (!ObjectId.isValid(id)) {
    const err = new Error("ID inválido");
    err.status = 400;
    throw err;
  }
  const db = getDb();
  const doc = await db.collection("Solicitudes").findOne({ _id: new ObjectId(id) });
  return doc;
}

const ESTADOS_VALIDOS = ["pendiente", "terminada"];

async function updateSolicitudStatus(id, status) {
  if (!ObjectId.isValid(id)) {
    const err = new Error("ID inválido");
    err.status = 400;
    throw err;
  }
  const normalized = String(status || "terminada").trim().toLowerCase();
  if (!ESTADOS_VALIDOS.includes(normalized)) {
    const err = new Error(`status debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`);
    err.status = 400;
    throw err;
  }
  const db = getDb();
  const _id = new ObjectId(id);
  const existing = await db.collection("Solicitudes").findOne({ _id });
  if (!existing) return null;
  if (existing.status === normalized) return existing;
  await db.collection("Solicitudes").updateOne(
    { _id },
    { $set: { status: normalized, updatedAt: new Date() } }
  );
  const updated = await db.collection("Solicitudes").findOne({ _id });
  return updated;
}

module.exports = {
  createSolicitud,
  getSolicitudes,
  getSolicitudById,
  updateSolicitudStatus,
  ESTADOS_VALIDOS,
  TIPOS_VALIDOS,
  PAISES_VALIDOS,
  PAGOS_POR_PAIS,
  TODOS_METODOS,
  WHATSAPP_PATTERN,
  WHATSAPP_WITH_PREFIX,
  WHATSAPP_LOCAL_PATTERN,
  PREFIJOS,
  validateSolicitud,
  normalizeWasap,
};
