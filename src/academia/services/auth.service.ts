import GenericError from "../../infrastructure/models/error.model";
import {Issuer} from "openid-client";
import axios from "axios";
import {v4 as uuid} from 'uuid'
import Cookie from "../../infrastructure/models/cookie.model";
import {KeycloakUserService} from "../../keycloak/services/user.service";

export class AcademiaUserService {
    public static async loginAndGetCookies(correo: string, contrasenia: string): Promise<{}> {
        const academiaIssuer = await Issuer.discover(`${process.env.SSO_UTEM_URL}/auth/realms/utem`)
        const client = new academiaIssuer.Client({ // Genera un link cliente para el flujo de autorización.
            client_id: 'academiaClient',
            client_secret: '36a42b74-eff1-40c4-b530-e5fd06332895',
        });

        let oauthUri = client.authorizationUrl({ // Genera el link de autorización sso
            redirect_uri: `${process.env.ACADEMIA_UTEM_URL}/sso`,
            scope: 'openid',
            response_type: 'code',
            response_mode: 'fragment',
            nonce: uuid(),
            state: uuid(),
        })

        const [loginResponse] = await KeycloakUserService.loginSSO({ oauthUri, esperaRedireccion: true, correo, contrasenia }) // Inicia sesión en sso

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
        if(`${postSsoResponse.data}` !== '200') {
            throw GenericError.CREDENCIALES_INCORRECTAS
        }

        let loginSsoResponse;
        try {
            loginSsoResponse = await axios.get(`${process.env.ACADEMIA_UTEM_URL}/login-sso`, {
                withCredentials: true,
                headers: {
                    Cookie: academiaSessionCookies.map(it => it.raw).join(";"),
                },
                maxRedirects: 0,
            });
        } catch (error: any) {
            if(error.response.status === 302){
                loginSsoResponse = error.response
            } else {
                throw GenericError.CREDENCIALES_INCORRECTAS
            }
        }

        // Siempre va a ser redirigido al perfil!
        if(loginSsoResponse.status !== 302){
            throw GenericError.CREDENCIALES_INCORRECTAS
        }

        try {
            // Seguir redirección para validar
            const perfilResponse = await axios.get(loginSsoResponse.headers.location, {
                withCredentials: true,
                headers: {
                    Cookie: academiaSessionCookies.map(it => it.raw).join(";"),
                }
            });

            if(`${perfilResponse.data}`.includes('Hola,') === false){ // Si no se logeó, se lanza un error
                throw GenericError.CREDENCIALES_INCORRECTAS
            }
        } catch (err) {
            if(`${err.response.data}`.includes('Hola,') === false){ // Si no se logeó, se lanza un error
                throw GenericError.CREDENCIALES_INCORRECTAS
            }
        }

        // Retorna solo las cookies.name y cookies.value en forma de objeto, así: { name: value }
        const cookiesResponse = {};
        academiaSessionCookies.forEach(it => cookiesResponse[it.name] = it.value)
        return cookiesResponse
    }
}

