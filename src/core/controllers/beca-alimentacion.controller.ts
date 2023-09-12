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
      if ([0,6].includes(dayjs().tz('America/Santiago').day())) {
        return next(GenericError.FUERA_DE_HORARIO_BECA_ALIMENTACION) // Si es sabado o domingo, no se puede generar codigo.
      }

      const cookies = res.locals.loggedInUser.academiaCookies;
      const desde = req.body.desde || dayjs().tz('America/Santiago').format('DD-MM-YYYY');
      const hasta = req.body.hasta || dayjs().tz('America/Santiago').add(7, 'day').format('DD-MM-YYYY');

      // Verifica si es formato DD-MM-YYYY
      if (!dayjs(desde, 'DD-MM-YYYY').tz('America/Santiago').isValid() || !dayjs(hasta, 'DD-MM-YYYY').tz('America/Santiago').isValid()) {
        return next(GenericError.FORMATO_FECHA_INVALIDO)
      }

      // Verifica si es entre hoy a las 00:00 y 40 días después
      const hoy = dayjs().tz('America/Santiago').startOf('day') // Hoy a las 00:00
      const fechaDesde = dayjs(desde, 'DD-MM-YYYY').tz('America/Santiago').startOf('day') // Desde a las 00:00
      const fechaHasta = dayjs(hasta, 'DD-MM-YYYY').tz('America/Santiago').endOf('day') // Hasta a las 23:59:59
      const maximoDias = dayjs().tz('America/Santiago').endOf('year') // Fin de año
      if (!dayjs(fechaDesde).isSameOrAfter(hoy)) { // Si no esta hoy o después
        const error = GenericError.FECHA_FUERA_DE_RANGO
        error.internalCode = 19.1
        return next(error)
      }

      if (!dayjs(fechaHasta).isSameOrBefore(maximoDias)) { // Si no está entre fin de año o antes
        const error = GenericError.FECHA_FUERA_DE_RANGO
        error.internalCode = 19.2
        return next(error)
      }

      const codigos = await BecaAlimentacionService.generarCodigoAlimentacion(cookies, desde, hasta)

      res.status(200).json(codigos);
    } catch (error) {
      next(error);
    }
  }
}
