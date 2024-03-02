import axios from "axios";
import { Issuer } from "openid-client";
import { v4 as uuid } from 'uuid';
import Cookie from "../../infrastructure/models/cookie.model";
import GenericError from "../../infrastructure/models/error.model";
import { KeycloakUserService } from "../../keycloak/services/user.service";

export class AcademiaUserService {
  public static async loginAndGetCookies(correo: string, contrasenia: string): Promise<Cookie[]> {
    const academiaIssuer = await Issuer.discover(`${process.env.SSO_UTEM_URL}/auth/realms/utem`)
    const client = new academiaIssuer.Client({ // Genera un link cliente para el flujo de autorización.
      client_id: 'academiaClient',
      client_secret: process.env.ACADEMIA_CLIENT_SECRET,
    });

    let oauthUri = client.authorizationUrl({ // Genera el link de autorización sso
      redirect_uri: `${process.env.ACADEMIA_UTEM_URL}/sso`,
      scope: 'openid',
      response_type: 'code',
      response_mode: 'fragment',
      nonce: uuid(),
      state: uuid(),
    })
    const [loginResponse] = await KeycloakUserService.loginSSO({ oauthUri, correo, contrasenia }) // Inicia sesión en sso

    const urlParams = new URLSearchParams(loginResponse.headers.location.split('/sso#')[1]) // Obtiene los parámetros de la url de redirección
    const tokenSet = await client.grant({ // Obtiene el token de autorización
      grant_type: 'authorization_code',
      code: urlParams.get('code'),
      redirect_uri: `${process.env.ACADEMIA_UTEM_URL}/sso`,
    })

    // Primero generamos una sesión en la academia.
    let academiaSessionCookies = (await axios.get(process.env.ACADEMIA_UTEM_URL, { // Obtiene las cookies de la academia
      withCredentials: true,
    })).headers['set-cookie'].map(it => Cookie.parse(it))

    // Ahora iniciamos sesión con el token en la academia.
    const postSsoResponse = await axios.post(`${process.env.ACADEMIA_UTEM_URL}/post-sso`, `token=${tokenSet.access_token}`, {
      withCredentials: true,
      headers: {
        Cookie: academiaSessionCookies.map(it => it.raw).join(";"),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    if (`${postSsoResponse.data}` !== '200') {
      throw GenericError.CREDENCIALES_INCORRECTAS
    }

    let loginSsoResponse;
    try {
      loginSsoResponse = await axios.get(`${process.env.ACADEMIA_UTEM_URL}/login-sso`, {
        withCredentials: true,
        headers: {
          Cookie: Cookie.header(academiaSessionCookies),
        },
        maxRedirects: 0,
      });
    } catch (error: any) {
      if (error.response.status === 302) {
        loginSsoResponse = error.response
      } else {
        throw GenericError.CREDENCIALES_INCORRECTAS
      }
    }

    // Siempre va a ser redirigido al perfil!
    if (loginSsoResponse.status !== 302) {
      throw GenericError.CREDENCIALES_INCORRECTAS
    }

    let perfilResponse;
    try {
      perfilResponse = await axios.get(`${process.env.ACADEMIA_UTEM_URL}/libro_de_clases/bitacora_de_clases`, {
        withCredentials: true,
        headers: {
          Cookie: Cookie.header(academiaSessionCookies),
        }
      });
    } catch (err) {
      perfilResponse = err.response
    }

    if (`${perfilResponse?.data}`.includes('Hola,') === false) { // Si no se logeó, se lanza un error
      throw GenericError.CREDENCIALES_INCORRECTAS
    }

    return academiaSessionCookies
  }

  public static async valido(cookies: Cookie[]): Promise<boolean> {
    try {
      const request = await axios.get(`${process.env.ACADEMIA_UTEM_URL}/`, {
        headers: {
          Cookie: Cookie.header(cookies),
        },
      })

      return `${request?.data}`.includes('id="kc-form-login"') === false && `${request?.data}`.includes('var keycloak = Keycloak') == false // Si es invalido, se redirige al login mostrando el formulario de autenticación o muestra la carga del sso
    } catch (_) {
    }
    return false
  }

  public static async cookiesValidas(cookies: Cookie[]): Promise<string> {
    const valido = await AcademiaUserService.valido(cookies)
    const sessionId: string = cookies?.find(it => it.name == "PHPSESSID")?.value || null;
    if (!valido || !sessionId) {
      throw GenericError.ACADEMIA_EXPIRO;
    }
    return sessionId;
  }

}
