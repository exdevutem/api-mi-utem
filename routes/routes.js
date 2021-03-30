const express = require("express");

const usuarios = require("./usuarios");
const asignaturas = require("./asignaturas");
const horarios = require("./horarios");
const notas = require("./notas");
const carreras = require("./carreras");

const router = express.Router();

router.use("/usuarios", usuarios);
router.use("/asignaturas", asignaturas);
router.use("/horarios", horarios);
router.use("/notas", notas);
router.use("/carreras", carreras);

module.exports = router;