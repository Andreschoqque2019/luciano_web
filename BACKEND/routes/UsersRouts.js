const { Router } = require("express");

const router = Router();

const User = require("../Model/userModel");


router.get("/", (req, res) => {
  console.log("todos los usuarios");
});

router.get("/usuario/:id" , (req,res)=>{
   // sacar valores del usuario (params
  console.log("obtener usuario con id");
});

router.post("/crear", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("Datos recibidos:", { name, email, password });

    const newUser = new User({ name, email, password });

    const savedUser = await newUser.save();
    res.status(201).json({message: "Usuario creado exitosamente", user: savedUser }
    );
    console.log("Usuario creado:");
  }

  catch (error) {
    console.error("Error en la solicitud:", error);
  }
});

router.put("/actualizar/:id", (req, res) => {
  console.log("actualizar usuario con id");
});

router.delete("/eliminar/:id",(req,res)=>{
  console.log("eliminar usuario con id");
}
);

module.exports = router;
