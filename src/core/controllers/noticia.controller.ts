import {NextFunction, Response, Request} from "express";
import {UtemNoticiasService} from "../../utem/services/utemNoticiasService";
import {dayjs} from "../../app";
import GenericError from "../../infrastructure/models/error.model";

export class NoticiaController {
  public static async getNoticias(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let query = req.query;
      query.desde = query.desde || dayjs().subtract(6, 'month').format('YYYY-MM-DD') // Por defecto desde hace 6 meses
      query.hasta = query.hasta || dayjs().format('YYYY-MM-DD') // Por defecto hasta hoy
      // Valida que el formato de fecha sea 'YYYY-MM-DD'
      const desdeDayjs = dayjs(query.desde, 'YYYY-MM-DD').tz('America/Santiago').startOf('day')
      if (query.desde && !desdeDayjs.isValid()) {
        const error = GenericError.FORMATO_FECHA_INVALIDO
        error.internalCode = 18.1
        return next(error)
      }

      const hastaDayjs = dayjs(query.hasta, 'YYYY-MM-DD').tz('America/Santiago').endOf('day')
      if (query.hasta && !hastaDayjs.isValid()) {
        const error = GenericError.FORMATO_FECHA_INVALIDO
        error.internalCode = 18.2
        return next(error)
      }

      const noticias = await UtemNoticiasService.getNoticias(
        query.por_pagina || 10,
        desdeDayjs.toISOString(),
        hastaDayjs.toISOString()
      );

      res.status(200).json(noticias);
    } catch (error) {
      next(error);
    }
  }
}
