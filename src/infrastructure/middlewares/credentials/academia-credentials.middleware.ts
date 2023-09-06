import { NextFunction, Request, Response } from "express";
import Cookie from "../../models/cookie.model";
import GenericError from "../../models/error.model";
import CredentialsUtils from "../../utils/credentials.utils";
import { CredentialsMiddleware } from "./credentials.middleware";

export class AcademiaCredentialsMiddleware extends CredentialsMiddleware {

  public static async isLoggedIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let error = GenericError.TOKEN_INVALIDA;
      let accessToken = AcademiaCredentialsMiddleware.validateToken(req)

      const academiaCookies: Cookie[] = CredentialsUtils.getAcademiaCookies(accessToken);
      if (academiaCookies.length === 0) {
        error.internalCode = 10.5
        return next(error);
      }

      res.locals.loggedInUser = {
        ...res.locals.loggedInUser,
        academiaCookies,
      }

      next();
    } catch (error: any) {
      next(error)
    }
  }
}
