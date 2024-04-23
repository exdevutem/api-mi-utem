import axios from "axios";
import Usuario from "../../core/models/usuario.model";
import GenericError from "../../infrastructure/models/error.model";
import {HashUtils} from "../../infrastructure/utils/hash.utils";
import Cookie from "../../infrastructure/models/cookie.model";

export class SigaApiAuthService {
  public static async loginAndGetToken(correo: string, contrasenia: string): Promise<string> {
    try {
      const response = await this.loginAndGetProfile(correo, contrasenia);
      return response.token;
    } catch (err) {
      if(err.internalCode === 1.2) {
        err.internalCode = 1.1
      }

      throw err
    }
  }

  public static async loginAndGetProfile(correo: string, contrasenia: string): Promise<Usuario> {
    try {
      const form = new FormData;
      form.set('username', correo);
      form.set('password', contrasenia);
      const res = await axios.post(`${process.env.SIGA_API_URL}/autenticacion/login/`, form, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Host: "siga.utem.cl",
          Cookie: Cookie.header(Cookie.from('SIGA', 'siga').withPath('/')),
        },
      });

      return {
        token: res.data.response.token,
        rut: res.data.response.datos_persona.rut,
        nombreCompleto: res.data.response.datos_persona.nombre_completo,
        correoPersonal: res.data.response.datos_persona.correo_personal,
        correoUtem: res.data.response.datos_persona.correo_utem,
        fotoBase64: res.data.response.datos_persona.foto,
        perfiles: res.data.response.datos_persona.perfiles,
      };
    } catch (err) {
      if (err.response?.status === 401) {
        console.debug({
          message: "Credenciales incorrectas",
          response: err?.response?.data,
          error: err,
        })
        const error = GenericError.CREDENCIALES_INCORRECTAS
        error.internalCode = 1.2
        error.metadata = {
          uid: HashUtils.md5(correo),
          statusCode: err.response?.status,
          statusText: err.response?.statusText,
          response: err.response?.data,
        }
        throw error
      }

      throw err
    }
  }
}
