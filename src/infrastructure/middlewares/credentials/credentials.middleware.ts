import { Request } from "express";
import GenericError from "../../models/error.model";

/**
 * Esta clase representa la base de los middleware 'Credentials', permitiendo una validación de token.
 */
export class CredentialsMiddleware {
  public static validateTokenExist(req: Request): boolean {
    let accessToken: string | undefined = req.headers["authorization"];

    return accessToken !== undefined && accessToken.length > 0;
  }

  public static validateTokenFormat(req: Request): string {
    let accessToken: string | undefined = req.headers["authorization"];

    if (!accessToken.startsWith("Bearer ")) {
      let error = GenericError.TOKEN_INVALIDA;
      error.internalCode = 10.2
      throw error;
    }

    return accessToken.slice(7, accessToken.length);
  }

  public static validateToken(req: Request): string {
    let existToken: boolean = CredentialsMiddleware.validateTokenExist(req);
    if (!existToken) {
      let error = GenericError.TOKEN_INVALIDA;
      error.internalCode = 10.1
      throw error;
    }

    return CredentialsMiddleware.validateTokenFormat(req);
  }
}
