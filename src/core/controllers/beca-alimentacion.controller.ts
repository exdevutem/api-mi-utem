import {NextFunction, Request, Response} from "express";
import {BecaAlimentacionService} from "../../academia/services/beca-alimentacion.service";
import CodigoBecaAlimentacion from "../../academia/models/codigo-beca-alimentacion.model";
import {dayjs} from "../../app";
import GenericError from "../models/internal/error.model";

export class BecaAlimentacionController {

  public static async solicitarCodigoBecaAlimentacion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ahora = dayjs().tz('America/Santiago')
      const desde = dayjs(req.body.desde || ahora.format('YYYY-MM-DD'), 'YYYY-MM-DD', true).tz('America/Santiago').startOf('day');
      if (!desde.isValid()) {
        const error = GenericError.FORMATO_FECHA_INVALIDO
        error.internalCode = 18.1
        error.publicMessage = `La fecha de inicio '${req.body.desde}' es inválida. Debe ser en formato YYYY-MM-DD.`
        return next(error)
      }

      let hasta = dayjs(req.body.hasta || ahora.format('YYYY-MM-DD'), 'YYYY-MM-DD', true).tz('America/Santiago').endOf('day');
      hasta.isBefore(desde) && (hasta = desde.endOf('day'));
      if (!hasta.isValid()) {
        const error = GenericError.FORMATO_FECHA_INVALIDO
        error.internalCode = 18.2
        error.publicMessage = `La fecha de término '${req.body.hasta}' es inválida. Debe ser en formato YYYY-MM-DD.`
        return next(error)
      }

      // Si es desde Sábado hasta domingo lanzar error
      if (desde.day() === 6 && hasta.day() === 0) {
        const error = GenericError.FUERA_DE_HORARIO_BECA_ALIMENTACION
        error.publicMessage = 'No se puede generar código de beca de alimentación para fines de semana.'
        return next(error) // Si es Sábado o domingo, no se puede generar código.
      }

      // Si desde no es ahora o después
      if (!desde.isSameOrAfter(ahora.startOf('day'))) {
        const error = GenericError.FECHA_FUERA_DE_RANGO
        error.internalCode = 19.1
        error.publicMessage = 'La fecha de inicio debe ser hoy o después.'
        return next(error)
      }

      if(!hasta.isAfter(desde)) {
        const error = GenericError.FECHA_FUERA_DE_RANGO
        error.internalCode = 19.3
        error.publicMessage = 'La fecha de término debe ser después de la fecha de inicio.'
        return next(error)
      }

      // Si ahora no es antes de fin de año
      if (!ahora.isSameOrBefore(dayjs().tz('America/Santiago').endOf('year'))) { // Si no está entre fin de año o antes
        const error = GenericError.FECHA_FUERA_DE_RANGO
        error.internalCode = 19.2
        error.publicMessage = 'La fecha de inicio debe ser antes de fin de año.'
        return next(error)
      }

      const cookies = res.locals.loggedInUser.academiaCookies;
      const codigos: CodigoBecaAlimentacion[] = await BecaAlimentacionService.generarCodigoAlimentacion(cookies, desde.toISOString(), hasta.toISOString())

      res.status(200).json(codigos);
    } catch (error) {
      next(error);
    }
  }
}
