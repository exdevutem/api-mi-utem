import {NextFunction, Request, Response} from "express";
import {BecaAlimentacionService} from "../../academia/services/beca-alimentacion.service";
import CodigoBecaAlimentacion from "../models/codigo-beca-alimentacion.model";
import {dayjs} from "../../app";
import GenericError from "../../infrastructure/models/error.model";

export class BecaAlimentacionController {

  public static async solicitarCodigoBecaAlimentacion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const desde: string | undefined = req.body.desde;
      if (desde && !dayjs(desde, 'YYYY-MM-DD').tz('America/Santiago').isValid()) {
        const error = GenericError.FORMATO_FECHA_INVALIDO
        error.internalCode = 18.1
        return next(error)
      }

      const hasta: string | undefined = req.body.hasta;
      if (hasta && !dayjs(hasta, 'YYYY-MM-DD').tz('America/Santiago').isValid()) {
        const error = GenericError.FORMATO_FECHA_INVALIDO
        error.internalCode = 18.2
        return next(error)
      }

      const ahora = dayjs().tz('America/Santiago')
      const desdeDayJS = ((desde ? dayjs(desde, 'YYYY-MM-DD').tz('America/Santiago') : ahora).startOf('day'));
      let hastaDayJS = (hasta ? dayjs(hasta, 'YYYY-MM-DD').tz('America/Santiago') : ahora).endOf('day');
      hastaDayJS.isBefore(desdeDayJS) && (hastaDayJS = desdeDayJS.endOf('day'));

      // Si es desde Sábado hasta domingo lanzar error
      if (desdeDayJS.day() === 6 && hastaDayJS.day() === 0) {
        return next(GenericError.FUERA_DE_HORARIO_BECA_ALIMENTACION) // Si es Sábado o domingo, no se puede generar código.
      }

      if (!desdeDayJS.isSameOrAfter(ahora.startOf('day'))) { // Si no esta hoy o después
        const error = GenericError.FECHA_FUERA_DE_RANGO
        error.internalCode = 19.1
        error.metadata = {
          ...error.metadata,
          desde: desdeDayJS.toISOString(),
          ahora: ahora.startOf('day').toISOString(),
          sameOrAfter: desdeDayJS.isSameOrAfter(ahora.startOf('day'))
        }
        return next(error)
      }

      if (!ahora.isSameOrBefore(dayjs().tz('America/Santiago').endOf('year'))) { // Si no está entre fin de año o antes
        const error = GenericError.FECHA_FUERA_DE_RANGO
        error.internalCode = 19.2
        return next(error)
      }

      const cookies = res.locals.loggedInUser.academiaCookies;
      const codigos: CodigoBecaAlimentacion[] = await BecaAlimentacionService.generarCodigoAlimentacion(cookies, desdeDayJS.toISOString(), hastaDayJS.toISOString())

      res.status(200).json(codigos);
    } catch (error) {
      next(error);
    }
  }
}
