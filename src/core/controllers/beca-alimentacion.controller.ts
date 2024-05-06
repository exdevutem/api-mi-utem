import {NextFunction, Request, Response} from "express";
import {BecaAlimentacionService} from "../../academia/services/beca-alimentacion.service";
import CodigoBecaAlimentacion from "../models/codigo-beca-alimentacion.model";
import {dayjs} from "../../app";
import GenericError from "../../infrastructure/models/error.model";

export class BecaAlimentacionController {

  public static async solicitarCodigoBecaAlimentacion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.body.desde && !dayjs(req.body.desde, 'YYYY-MM-DD').tz('America/Santiago').isValid()) {
        const error = GenericError.FORMATO_FECHA_INVALIDO
        error.internalCode = 18.1
        return next(error)
      }

      if (req.body.hasta && !dayjs(req.body.hasta, 'YYYY-MM-DD').tz('America/Santiago').isValid()) {
        const error = GenericError.FORMATO_FECHA_INVALIDO
        error.internalCode = 18.2
        return next(error)
      }

      const ahora = dayjs().tz('America/Santiago')

      const cookies = res.locals.loggedInUser.academiaCookies;
      const desdeInicioCodigo = ((req.body.desde ? dayjs(req.body.desde, 'YYYY-MM-DD').tz('America/Santiago') : ahora).startOf('day'));
      let hastaDiaCodigo = (req.body.hasta ? dayjs(req.body.hasta, 'YYYY-MM-DD').tz('America/Santiago') : ahora).endOf('day');
      hastaDiaCodigo.isBefore(desdeInicioCodigo) && (hastaDiaCodigo = desdeInicioCodigo.endOf('day'));

      // Si es desde Sábado hasta domingo lanzar error
      if (desdeInicioCodigo.day() === 6 && hastaDiaCodigo.day() === 0) {
        return next(GenericError.FUERA_DE_HORARIO_BECA_ALIMENTACION) // Si es Sábado o domingo, no se puede generar código.
      }

      // Verifica si es entre hoy a las 00:00 y ahora
      if (!desdeInicioCodigo.isSameOrAfter(ahora.startOf('day'))) { // Si no esta hoy o después
        const error = GenericError.FECHA_FUERA_DE_RANGO
        error.internalCode = 19.1
        return next(error)
      }

      if (!ahora.isSameOrBefore(dayjs().tz('America/Santiago').endOf('year'))) { // Si no está entre fin de año o antes
        const error = GenericError.FECHA_FUERA_DE_RANGO
        error.internalCode = 19.2
        return next(error)
      }

      const codigos: CodigoBecaAlimentacion[] = await BecaAlimentacionService.generarCodigoAlimentacion(cookies, desdeInicioCodigo.toISOString(), hastaDiaCodigo.toISOString())

      res.status(200).json(codigos);
    } catch (error) {
      next(error);
    }
  }
}
