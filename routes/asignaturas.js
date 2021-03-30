const express = require("express");

const asignatura = require("../controllers/asignatura.controller");

const { verificarUsuario } = require("../middlewares/auth");

const router = express.Router();

router.get("/", verificarUsuario, asignatura.obtenerAsignaturas);
router.get("/:codigoAsignatura", verificarUsuario, asignatura.obtenerDetalleAsignatura);
router.get("/:codigoAsignatura/notas", verificarUsuario, asignatura.obtenerNotasPorCodigo);

module.exports = router;