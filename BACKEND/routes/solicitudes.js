const { Router } = require("express");
const { createSolicitud, getSolicitudes, getSolicitudById } = require("../model/Solicitud");

const router = Router();

// POST /api/solicitudes
router.post("/", async (req, res) => {
  try {
    const { tipo, pais, metodoPago, numero_wasap, nota_adicional, NOTA_ADICIONAL, nota } = req.body || {};

    // Compatibilidad: frontend envía numero_wasap / wasap / NOTA_ADICIONAL / nota
    const wasapFinal = numero_wasap || req.body.wasap || "";
    const notaFinal = nota_adicional ?? NOTA_ADICIONAL ?? nota ?? "";

    const doc = await createSolicitud({
      tipo,
      pais,
      metodoPago,
      numero_wasap: wasapFinal,
      nota_adicional: notaFinal,
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
