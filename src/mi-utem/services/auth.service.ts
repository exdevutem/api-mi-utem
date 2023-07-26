import Cookie from "../../infrastructure/models/cookie.model";
import {KeycloakUserService} from "../../keycloak/services/user.service";
import GenericError from "../../infrastructure/models/error.model";
import axios from "axios";

export class MiUtemAuthService {

  public static async loginAndGetCookies(correo: string, contrasenia: string): Promise<Cookie[]> {
    // Genera URI para redirigir a la página de login de miutem
    let oauthRequest;
    try {
      oauthRequest = await axios.get(`${process.env.MI_UTEM_URL}/oidc/authenticate/`, {
        maxRedirects: 0,
      })
    } catch (err) {
      if (err.response.status !== 302) {
        throw err
      }

      oauthRequest = err.response
    }
    const miutemBaseCookies = oauthRequest.headers['set-cookie'].map(it => Cookie.parse(it))

    // Hacer login
    const [response, cookies] = await KeycloakUserService.loginSSO({
      oauthUri: oauthRequest.headers.location,
      correo,
      contrasenia
    })

    // Llama al callback del MiUTEM
    let callbackResponse;
    try {
      callbackResponse = await axios.get(response.headers.location, { // Finaliza el login
        headers: {
          Cookie: Cookie.header(Cookie.merge(miutemBaseCookies, cookies)),
        },
        maxRedirects: 0
      })
    } catch (err) {
      if(err.response.status !== 302) {
        throw err
      }

      callbackResponse = err.response
    }

    const miutemCookies = callbackResponse.headers["set-cookie"].map(it => Cookie.parse(it))
    if (miutemCookies.length === 0) {
      throw GenericError.MI_UTEM_EXPIRO
    }

    return (await axios.get(`${process.env.MI_UTEM_URL}/`, {
      headers: {
        Cookie: Cookie.header(miutemCookies),
      }
    })).headers["set-cookie"].map(it => Cookie.parse(it))
  }

  // Revisa que las cookies sean válidas
  public static async valido(cookies: Cookie[]): Promise<boolean> {
    try {
      const request = await axios.get(`${process.env.MI_UTEM_URL}/users/mi_perfil`, {
        headers: {
          Cookie: Cookie.header(cookies),
        },
      })

      return `${request?.data}`.includes('id="kc-form-login"') === false // Si es invalido, se redirige al login mostrando el formulario de autenticación
    } catch(_) {}
    return false
  }

  // Valida las cookies y retorna el sessionid y el csrftoken.
  public static async cookiesValidas(cookies: Cookie[]): Promise<[string, string]> {
    const valido = await MiUtemAuthService.valido(cookies)
    const sessionId: string = cookies?.find(it => it.name == "sessionid")?.value || null;
    const csrfToken: string = cookies?.find(it => it.name == "csrftoken")?.value || null;
    if (!valido || !sessionId || !csrfToken) {
      throw GenericError.MI_UTEM_EXPIRO;
    }

    return [sessionId, csrfToken];
  }
}
