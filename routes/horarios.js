const express = require("express");

const horario = require("../controllers/horario.controller");

const { verificarUsuario } = require("../middlewares/auth");

const router = express.Router();

router.get("/", verificarUsuario, horario.obtenerHorario);

module.exports = router;