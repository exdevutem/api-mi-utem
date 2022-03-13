import jwt from "jsonwebtoken";
import { Cookie, SetCookie } from "puppeteer";
import Usuario from "../../core/models/usuario.model";

export default class CredentialsUtils {
  public static getMiUtemCookies(token: string): SetCookie[] {
    const cookies: string = token.split("|")[0];
    const sessionId: string = cookies.slice(0, 32);
    const csrfToken: string = cookies.slice(32);

    let date = new Date();
    date.setDate(date.getDate() + 364);

    return [
      {
        name: "sessionid",
        value: sessionId,
        domain: "mi.utem.cl",
        path: "/",
        expires: -1,
        httpOnly: true,
        secure: false,
        session: true,
        sameSite: "Lax",
      },
      {
        name: "MIUTEM",
        value: "miutem1",
        domain: "mi.utem.cl",
        path: "/",
        expires: -1,
        httpOnly: false,
        secure: false,
        session: true,
      },
      {
        name: "csrftoken",
        value: csrfToken,
        domain: "mi.utem.cl",
        path: "/",
        expires: date.getTime() / 1000,
        httpOnly: false,
        secure: false,
        session: false,
        sameSite: "Lax",
      },
      {
        name: "dialogShown",
        value: "0",
        domain: "mi.utem.cl",
        path: "/",
        expires: date.getTime() / 1000,
        httpOnly: false,
        secure: false,
        session: false,
      },
    ];
  }

  public static getSigaUser(sigaBearerToken: string): Usuario | null {
    if (sigaBearerToken != null) {
      const sigaPayload: any = jwt.decode(sigaBearerToken);

      return {
        nombres: sigaPayload.given_name,
        apellidos: sigaPayload.family_name,
        nombreCompleto: sigaPayload.name,
        correoUtem: sigaPayload.email,
        username: sigaPayload.preferred_username,
      };
    }
  }

  public static getSigaToken(token: string): string | undefined {
    return token.split("|")[1];
  }

  public static createToken(
    sigaBearerToken: string,
    miUtemCookies: Cookie[]
  ): string {
    let sessionId: string = "";
    let csrfToken: string = "";

    if (miUtemCookies) {
      for (const cookie of miUtemCookies) {
        if (cookie.name == "sessionid") {
          sessionId = cookie.value;
        }
        if (cookie.name == "csrftoken") {
          csrfToken = cookie.value;
        }
      }
    }

    return sessionId + csrfToken + "|" + sigaBearerToken;
  }
}
