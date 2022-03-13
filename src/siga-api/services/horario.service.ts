import axios, { AxiosResponse } from "axios";
import qs from "qs";
import Horario from "../../core/models/horario.model";

export class SigaApiHorarioService {
  public static async getHorarioByCarrera(
    token: string,
    carreraId: string
  ): Promise<Horario> {
    const uri: string = "/estudiante/horario/";
    const url: string = `${process.env.SIGA_API_URL}${uri}`;

    let res: AxiosResponse = await axios.post(
      url,
      qs.stringify({
        token,
        carrera_id: carreraId,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Host: "siga.utem.cl",
        },
      }
    );

    let horario: Horario = {
      horario: Array(18)
        .fill(null)
        .map(() => Array(6).fill(null)),
    };

    for (const bloque of res.data.response) {
      let diaIndex = bloque.dia_numero - 1;
      let bloqueIndex = bloque.bloque - 1;

      horario.horario[bloqueIndex][diaIndex] = {
        asignatura: {
          codigo: bloque.codigo_asignatura,
          nombre: bloque.nombre_asignatura,
          seccion: bloque.asignatura_seccion,
          docente: bloque.asignatura_profesor,
          tipoHora: bloque.tipo_hora,
        },
        sala: bloque.sala,
      };
    }

    return horario;
  }
}
