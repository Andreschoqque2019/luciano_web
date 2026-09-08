const { Router } = require("express");
const { getUserByEmail } = require("../model/User");

const router = Router();

router.get("/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.json(user);
  } catch (error) {
    console.error("Error obteniendo cuenta:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;
