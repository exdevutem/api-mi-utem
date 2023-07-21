import chileanRut from "chilean-rut";
import {NextFunction, Request, Response} from "express";
import {
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  getFirestore,
} from "firebase-admin/firestore";
import GenericError from "../../infrastructure/models/error.model";
import FcmUtils from "../../infrastructure/utils/fcm.utils";
import Usuario from "../models/usuario.model";

export class NotificacionController {
  public static async notificate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const db: Firestore = getFirestore();

    let rut: string = req.body.rut || '';
    let valor: string = req.body.valor;
    let codigo: string = req.body.codigo || '';
    let seccionId: string = req.body.seccionId || '';
    let nombre: string = req.body.nombre;
    let key: string = req.body.key || '';

    if (!(key.length > 0 && rut.length > 0 && (codigo.length > 0 || seccionId.length > 0))) {
      return next(GenericError.BAD_REQUEST);
    }

    if (key != process.env.SISEI_KEY) {
      return next(GenericError.SISEI_KEY_INVALIDA);
    }

    let usuario: Usuario;

    try {
      rut = chileanRut.unformat(rut.toString());

      if (chileanRut.correctValidatorDigit(rut)) {
        rut = rut.substring(0, rut.length - 1);
      }

      const usuarioRef: DocumentReference = db
        .collection("usuarios")
        .doc(rut);
      const usuarioDoc: DocumentSnapshot<Usuario> = await usuarioRef.get();

      usuario = usuarioDoc.data();
    } catch (error) {
      return next(error);
    }

    if (!usuario) {
      return next(GenericError.FIRESTORE_USUARIO_RUT_NO_ENCONTRADO);
    }


    try {
      let title = "Nota actualizada";
      if (nombre && nombre != "") {
        title += ` en ${nombre.toTitleCase()}`;
      }

      const body = "Presiona para ir a ver tus notas";
      const data = {
        valor: valor.toString(),
        codigo: codigo.toString(),
        seccionId: seccionId.toString(),
        rut: rut.toString(),
      };

      const result = await FcmUtils.sendNotification(
        usuario.fcmTokens,
        {title, body},
        data
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
