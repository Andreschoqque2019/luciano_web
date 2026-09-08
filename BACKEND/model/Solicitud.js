const { ObjectId } = require("mongodb");
const { getDb } = require("../Config/db");

const TIPOS_VALIDOS = ["pase", "orbes", "esencias", "comidas", "gemas"];
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
const WHATSAPP_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;

function validateSolicitud({ tipo, pais, metodoPago, numero_wasap, nota_adicional }) {
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
  if (!numero_wasap || typeof numero_wasap !== "string" || !numero_wasap.trim()) {
    errors.push("numero_wasap es requerido");
  } else if (!WHATSAPP_PATTERN.test(numero_wasap.trim())) {
    errors.push("numero_wasap formato inválido. Use +?[0-9\\s\\-()]{7,20}");
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

async function createSolicitud({ tipo, pais, metodoPago, numero_wasap, nota_adicional }) {
  const errors = validateSolicitud({ tipo, pais, metodoPago, numero_wasap, nota_adicional });
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
    numero_wasap: numero_wasap.trim(),
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

module.exports = {
  createSolicitud,
  getSolicitudes,
  getSolicitudById,
  TIPOS_VALIDOS,
  PAISES_VALIDOS,
  PAGOS_POR_PAIS,
  TODOS_METODOS,
  WHATSAPP_PATTERN,
  validateSolicitud,
};
