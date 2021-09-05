const express = require("express");

const nota = require("../controllers/nota.controller");
const notificacion = require("../controllers/notificacion.controller");

const { verificarUsuario } = require("../middlewares/auth");

const router = express.Router();

router.get("/", verificarUsuario, nota.obtenerNotas);
router.post("/notificar", notificacion.notificarNota);

module.exports = router;