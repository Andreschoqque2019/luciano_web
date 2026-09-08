const { Router } = require("express");
const { getDb } = require("../Config/db");
const { findUserByEmail, updateBalance } = require("../model/User");

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email, amount, method } = req.body;

    if (!email || !amount || !method) {
      return res.status(400).json({ error: "Correo, monto y método de pago son requeridos." });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "El monto debe ser mayor a S/ 0.00." });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const newBalance = Number((user.balance + parsedAmount).toFixed(2));
    await updateBalance(email, newBalance);

    const db = getDb();
    await db.collection("topups").insertOne({
      userId: user._id,
      email: email.toLowerCase(),
      amount: parsedAmount,
      method,
      date: new Date(),
    });

    res.json({ _id: user._id, name: user.name, email: user.email, balance: newBalance });
  } catch (error) {
    console.error("Error en recarga:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;
