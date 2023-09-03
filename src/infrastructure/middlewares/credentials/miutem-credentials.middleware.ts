import {CredentialsMiddleware} from "./credentials.middleware";
import {NextFunction, Request, Response} from "express";
import CredentialsUtils from "../../utils/credentials.utils";
import Cookie from "../../models/cookie.model";

export class MiUTEMCredentialsMiddleware extends CredentialsMiddleware {

  public static async isLoggedIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let [error, accessToken] = this.validateToken(req)
      if(accessToken.length === 0) {
        return next(accessToken)
      }

      const miUtemCookies: Cookie[] = CredentialsUtils.getMiUtemCookies(accessToken);
      if(miUtemCookies.length === 0) {
        error.internalCode = 10.3
        return next(error);
      }

      res.locals.loggedInUser = {
        ...res.locals.loggedInUser,
        miUtemCookies,
      }
      next();
    }catch(error: any) {
      next(error)
    }
  }
}
