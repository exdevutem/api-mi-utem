const express = require("express");

const carrera = require("../controllers/carrera.controller");

const { verificarUsuario } = require("../middlewares/auth");

const router = express.Router();

router.get("/", verificarUsuario, carrera.getCarreras);
router.get("/activa", verificarUsuario, carrera.getCarrerasActiva);

module.exports = router;