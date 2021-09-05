require("dotenv").config();

const MiUtemError = require("../utils/errors");
const admin = require("firebase-admin");
const chileanRut = require("chilean-rut");

const { enviarNotificacion } = require("../utils/fcm");

const notificarNota = async (req, res, next) => {
  let { rut, valor, codigo, nombre, key } = req.body;

  if (key && key != "" && rut && rut != "" && codigo && codigo != "") {
    if (key == process.env.SISEI_KEY) {
      let usuario;

      try {
        rut = chileanRut.unformat(rut.toString());

        if (chileanRut.correctValidatorDigit(rut)) {
          rut = rut.substring(0, rut.length - 1);
        }

        const db = admin.firestore();
        const usuarioRef = db.collection("usuarios").doc(rut);
        const usuarioDoc = await usuarioRef.get();

        usuario = usuarioDoc.data();
      } catch (error) {
        return next(error);
      }

      if (usuario) {
        try {
          let title = "Nota actualizada";
          if (nombre &&  nombre != "") {
            title += ` en ${nombre.toTitleCase()}`;
          }

          const body = "Presiona para ir a ver tus notas";
          const data = {
            valor: valor.toString(),
            codigo: codigo.toString(),
            rut: rut.toString(),
          };

          const result = await enviarNotificacion(
            usuario.fcmTokens,
            { title, body },
            data
          );
          return res.status(200).json(result);
        } catch (error) {
          return next(error);
        }
      } else {
        return next(MiUtemError.FIRESTORE_USUARIO_RUT_NO_ENCONTRADO);
      }
    } else {
      return next(MiUtemError.SISEI_KEY_INVALIDA);
    }
  } else {
    return next(MiUtemError.BAD_REQUEST);
  }
};

module.exports = {
  notificarNota,
};
