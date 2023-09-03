import {CredentialsMiddleware} from "./credentials.middleware";
import {NextFunction, Request, Response} from "express";
import CredentialsUtils from "../../utils/credentials.utils";
import Cookie from "../../models/cookie.model";

export class AcademiaCredentialsMiddleware extends CredentialsMiddleware {

  public static async isLoggedIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let [error, accessToken] = this.validateToken(req)
      if(accessToken.length === 0) {
        return next(accessToken)
      }

      const academiaCookies: Cookie[] = CredentialsUtils.getAcademiaCookies(accessToken);
      if(academiaCookies.length === 0) {
        error.internalCode = 10.5
        return next(error);
      }

      res.locals.loggedInUser = {
        ...res.locals.loggedInUser,
        academiaCookies,
      }

      next();
    }catch(error: any) {
      next(error)
    }
  }
}
