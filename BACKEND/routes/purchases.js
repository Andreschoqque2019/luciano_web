const { Router } = require("express");
const { getDb } = require("../Config/db");

const router = Router();

router.get("/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const db = getDb();

    const purchases = await db
      .collection("purchases")
      .find({ email: email.toLowerCase() })
      .sort({ date: -1 })
      .toArray();

    res.json(purchases);
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;
