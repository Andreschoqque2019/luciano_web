const { Router } = require("express");
const { createSolicitud, getSolicitudes, getSolicitudById, PREFIJOS, WHATSAPP_WITH_PREFIX } = require("../model/Solicitud");

const router = Router();

function normalizeWasapInput(wasap, pais) {
  if (!wasap || typeof wasap !== "string") return wasap;
  let raw = wasap.trim().replace(/[\s\-()]/g, "");
  if (!raw) return raw;
  if (raw.startsWith("+")) return raw;
  if (raw.startsWith("00")) return `+${raw.slice(2)}`;
  const prefijo = PREFIJOS[pais] || "";
  if (prefijo) return `${prefijo}${raw}`;
  return raw;
}

// POST /api/solicitudes
router.post("/", async (req, res) => {
  try {
    const { tipo, pais, metodoPago, numero_wasap, nota_adicional, NOTA_ADICIONAL, nota, cantidad } = req.body || {};

    // Compatibilidad: frontend envía numero_wasap / wasap / NOTA_ADICIONAL / nota
    let wasapFinal = numero_wasap || req.body.wasap || "";
    const notaFinal = nota_adicional ?? NOTA_ADICIONAL ?? nota ?? "";
    let cantidadFinal = cantidad ?? req.body.cantidad;

    // Compatibilidad: si no viene cantidad, error; si viene como string, se valida en modelo
    // Normalizar wasap con prefijo si falta según pais
    if (wasapFinal && typeof wasapFinal === "string" && pais) {
      const raw = wasapFinal.trim().replace(/[\s\-()]/g, "");
      if (raw && !raw.startsWith("+") && !raw.startsWith("00")) {
        wasapFinal = normalizeWasapInput(wasapFinal, pais);
      } else if (raw.startsWith("00")) {
        wasapFinal = `+${raw.slice(2)}`;
      } else if (raw.startsWith("+")) {
        wasapFinal = raw;
      }
    }

    // Fallback validación rápida de wasap con prefijo para dar error temprano
    if (wasapFinal && typeof wasapFinal === "string" && wasapFinal.trim()) {
      const check = wasapFinal.trim().replace(/[\s\-()]/g, "");
      // Permitir que el modelo maneje la validación detallada, solo log si no matchea
      // No bloqueamos aquí si no tiene prefijo y no hay pais, dejamos que validateSolicitud decida
      if (check.startsWith("+") && !WHATSAPP_WITH_PREFIX.test(check)) {
        // dejamos que el modelo devuelva 400 con detalle
      }
    }

    const doc = await createSolicitud({
      tipo,
      pais,
      metodoPago,
      numero_wasap: wasapFinal,
      nota_adicional: notaFinal,
      cantidad: cantidadFinal,
    });

    return res.status(201).json(doc);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message, details: error.details || [] });
    }
    console.error("Error en POST /api/solicitudes:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

// GET /api/solicitudes?pais=&tipo=
router.get("/", async (req, res) => {
  try {
    const { pais, tipo } = req.query;
    const filter = {};
    if (pais) filter.pais = pais;
    if (tipo) filter.tipo = tipo;
    const list = await getSolicitudes(filter);
    return res.json(list);
  } catch (error) {
    console.error("Error en GET /api/solicitudes:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

// GET /api/solicitudes/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await getSolicitudById(id);
    if (!doc) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }
    return res.json(doc);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error en GET /api/solicitudes/:id:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;
