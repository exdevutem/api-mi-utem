const { sesionStringToJsonCookies } = require("../utils/cookies")

let verificarUsuario = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).json({
      error: "Tu petición no tiene cabecera de autorización",
    });
  }

  var sesion = req.headers.authorization.split(" ")[1];

  try {
    const jsonCookies = sesionStringToJsonCookies(sesion);
    req.cookies = jsonCookies;
    next();
  } catch (ex) {
    return res.status(404).send({
      error: "EL token no es valido",
    });
  }
};

module.exports = {
  verificarUsuario,
};