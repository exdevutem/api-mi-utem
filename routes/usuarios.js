const express = require("express");

const usuario = require("../controllers/usuario.controller");

const { verificarUsuario } = require("../middlewares/auth");

const router = express.Router();

router.post("/", usuario.getProfile);
router.post("/login", usuario.doLoginAndGetProfile);
router.post("/reset", usuario.doResetPassword);
router.post("/refresh", usuario.refreshToken);
router.put("/foto", verificarUsuario, usuario.doChangeImage);

module.exports = router;