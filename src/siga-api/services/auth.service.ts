import axios, { AxiosResponse } from "axios";
import qs from "qs";
import Usuario from "../../core/models/usuario.model";

export class SigaApiAuthService {
  public static async loginAndGetProfile(
    correo: string,
    contrasenia: string
  ): Promise<Usuario> {
    const uri: string = "/autenticacion/login/";
    const url: string = `${process.env.SIGA_API_URL}${uri}`;

    let res: AxiosResponse = await axios.post(
      url,
      qs.stringify({
        username: correo,
        password: contrasenia,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Host: "siga.utem.cl",
        },
      }
    );
    const usuario: Usuario = {
      token: res.data.response.token,
      rut: res.data.response.datos_persona.rut,
      nombreCompleto: res.data.response.datos_persona.nombre_completo,
      correoPersonal: res.data.response.datos_persona.correo_personal,
      correoUtem: res.data.response.datos_persona.correo_utem,
      fotoBase64: res.data.response.datos_persona.foto,
      perfiles: res.data.response.datos_persona.perfiles,
    };

    return usuario;
  }
}
