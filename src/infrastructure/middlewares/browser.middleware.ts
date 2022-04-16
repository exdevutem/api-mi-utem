import { NextFunction, Request, Response } from "express";
import { browser } from "../../app";
import GenericError from "../models/error.model";

export class BrowserMiddleware {
  public static async requireActiveBrowser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (browser) {
      return next();
    }
    return next(GenericError.BROWSER_NO_INICIALIZADO);
  }
}
