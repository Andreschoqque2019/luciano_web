const { Router } = require("express");

const bcrypt = require("bcryptjs");

const { createUser, findUserByEmail } = require("../model/User");

const router = Router();

router.post("/register", async (req, res) => {

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nombre, correo y contraseña son requeridos." });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres." });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo." });
    }

    const user = await createUser({ name, email, password });
    res.status(201).json(user);
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Correo y contraseña son requeridos." });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    const { password: _, ...safeUserData } = user;
    res.json(safeUserData);
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;
