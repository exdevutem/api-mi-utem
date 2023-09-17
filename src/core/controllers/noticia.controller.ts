import {NextFunction, Response, Request} from "express";
import {NoticiasService} from "../../utem/services/noticias.service";

export class NoticiaController {
  public static async getNoticias(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const noticias = await NoticiasService.getNoticias(req.query.por_pagina || 10);

      res.status(200).json(noticias);
    } catch (error) {
      next(error);
    }
  }
}
