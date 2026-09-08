const { Router } = require("express");
const { getDb } = require("../Config/db");
const { findUserByEmail, updateBalance } = require("../model/User");

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email, items, subtotal, tax, total } = req.body;

    if (!email || !items || !items.length) {
      return res.status(400).json({ error: "Correo y al menos un producto son requeridos." });
    }

    const parsedTotal = Number(total);
    if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
      return res.status(400).json({ error: "El total debe ser mayor a S/ 0.00." });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (user.balance < parsedTotal) {
      return res.status(400).json({ error: "Saldo insuficiente para esta compra." });
    }

    const newBalance = Number((user.balance - parsedTotal).toFixed(2));
    await updateBalance(email, newBalance);

    const db = getDb();
    await db.collection("purchases").insertOne({
      userId: user._id,
      email: email.toLowerCase(),
      items,
      subtotal: Number(subtotal),
      tax: Number(tax),
      total: parsedTotal,
      date: new Date(),
    });

    res.json({ _id: user._id, name: user.name, email: user.email, balance: newBalance });
  } catch (error) {
    console.error("Error en checkout:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;
