import Cookie from "../../infrastructure/models/cookie.model";
import {KeycloakUserService} from "../../keycloak/services/user.service";
import axios from "axios";
import GenericError from "../../infrastructure/models/error.model";

export class MiUtemAuthService {

    public static async loginAndGetCookies(correo: string, contrasenia: string): Promise<Cookie[]> {
        const [_, cookies] = await KeycloakUserService.loginSSO({ correo, contrasenia })
        return cookies
    }

    // Revisa que las cookies sean válidas
    public static async valido(cookies: Cookie[]): Promise<boolean> {
        const request = await axios.get(process.env.MIUTEM_URL, {
            headers: {
                Cookie: cookies.map(it => it.raw).join(';'),
            },
        })

        return `${request?.data}`.includes('id="kc-form-login"') === false // Si es invalido, se redirige al login mostrando el formulario de autenticación
    }

    // Valida las cookies y retorna el sessionid y el csrftoken.
    public static async cookiesValidas(cookies: Cookie[]): Promise<[string, string]> {
        const valido = await MiUtemAuthService.valido(cookies)
        if (!valido) {
            throw GenericError.MI_UTEM_EXPIRO;
        }

        const sessionId: string = cookies.find(it => it.name == "sessionid").value;
        const csrfToken: string = cookies.find(it => it.name == "csrftoken").value;

        return [sessionId, csrfToken];
    }
}
