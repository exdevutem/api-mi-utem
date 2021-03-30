const express = require("express");

const nota = require("../controllers/nota.controller");

const { verificarUsuario } = require("../middlewares/auth");

const router = express.Router();

router.get("/", verificarUsuario, nota.obtenerNotas);

module.exports = router;