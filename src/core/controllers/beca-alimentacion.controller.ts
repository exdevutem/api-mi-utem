import {NextFunction, Request, Response} from "express";
import {BecaAlimentacionService} from "../../academia/services/beca-alimentacion.service";
import CodigoBecaAlimentacion from "../models/codigo-beca-alimentacion.model";
import {dayjs} from "../../app";
import GenericError from "../../infrastructure/models/error.model";

export class BecaAlimentacionController {
  public static async getCodigoBecaAlimentacion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cookies = res.locals.loggedInUser.academiaCookies;

      const codigos: CodigoBecaAlimentacion[] = await BecaAlimentacionService.obtenerCodigoAlimentacion(cookies)

      res.status(200).json(codigos);
    } catch (error) {
      next(error);
    }
  }

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

      const ahora = dayjs().tz('America/Santiago') // Hoy a las 00:00

      const cookies = res.locals.loggedInUser.academiaCookies;
      const desde = (dayjs(req.body.desde, 'YYYY-MM-DD').tz('America/Santiago') || ahora).startOf('day');
      const hasta = (dayjs(req.body.hasta, 'YYYY-MM-DD').tz('America/Santiago') || ahora).endOf('day');

      // Si es desde sabado hasta domingo lanzar error
      if (dayjs(desde).tz('America/Santiago').day() === 6 && dayjs(hasta).tz('America/Santiago').day() === 0) {
        return next(GenericError.FUERA_DE_HORARIO_BECA_ALIMENTACION) // Si es sabado o domingo, no se puede generar codigo.
      }

      // Verifica si es entre hoy a las 00:00 y 40 días después
      if (!dayjs(desde).isSameOrAfter(ahora.startOf('day'))) { // Si no esta hoy o después
        const error = GenericError.FECHA_FUERA_DE_RANGO
        error.internalCode = 19.1
        return next(error)
      }

      if (!dayjs(ahora).isSameOrBefore(dayjs().tz('America/Santiago').endOf('year'))) { // Si no está entre fin de año o antes
        const error = GenericError.FECHA_FUERA_DE_RANGO
        error.internalCode = 19.2
        return next(error)
      }

      const codigos = await BecaAlimentacionService.generarCodigoAlimentacion(cookies, desde.toISOString(), hasta.toISOString())

      res.status(200).json(codigos);
    } catch (error) {
      next(error);
    }
  }
}
