import jwt from "jsonwebtoken";
import Usuario from "../../core/models/usuario.model";
import Cookie from "../models/cookie.model";

export default class CredentialsUtils {
  public static getMiUtemCookies(token: string): Cookie[] {
    const base64 = token.split("|")[0]
    if(!CredentialsUtils.isBase64(base64)) {
      return [];
    }
    const data: string[] = atob(base64).split("|"); // Formato: expira|sessionId|csrfToken
    if(data.length !== 3) { // Valida el formato
      return [];
    }

    const expira = new Date(parseInt(data[0]) * 1000);
    if(expira < new Date()) { // Valida que no haya expirado
      return [];
    }

    const sessionId: string = data[1];
    const csrfToken: string = data[2];

    let date = new Date();
    date.setDate(date.getDate() + 364);
    return [
      new Cookie("sessionid", sessionId),
      new Cookie("csrftoken", csrfToken),
      new Cookie("MIUTEM", "miutem1"),
      new Cookie("dialogShown", "0"),
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

  public static createToken(sigaBearerToken: string, miUtemCookies: Cookie[]): string {
    const sessionId: string = miUtemCookies.find(cookie => cookie.name == "sessionid")?.value || "";
    const csrfToken: string = miUtemCookies.find(cookie => cookie.name == "csrftoken")?.value || "";
    const expira = new Date((new Date).getTime() + (6 * 60 * 60 * 1000));
    const miutemToken = btoa(`${expira}|${sessionId}|${csrfToken}`)

    return `${miutemToken}|${sigaBearerToken}`;
  }

  public static get emptyCookies(): object {
    return [
      {
        name: "sessionid",
        value: "",
        domain: "mi.utem.cl",
        path: "/",
        expires: -1,
        httpOnly: true,
        secure: false,
        session: true,
        sameSite: "Lax",
      },
      {
        name: "csrftoken",
        value: "",
        domain: "mi.utem.cl",
        path: "/",
        expires: -1,
        httpOnly: false,
        secure: false,
        session: false,
        sameSite: "Lax",
      },
    ];
  }

  private static isBase64(str: string): boolean {
    try {
      return btoa(atob(str)) == str;
    } catch (err) {
      return false;
    }
  }
}
