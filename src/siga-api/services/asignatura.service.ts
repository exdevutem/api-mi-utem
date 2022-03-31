import axios, { AxiosResponse } from "axios";
import qs from "qs";
import Evaluacion from "../../core/models/evaluacion.model";
import SeccionAsignatura from "../../core/models/seccion-asignatura.model";

export class SigaApiAsignaturaService {
  public static async getAsignaturas(
    token: string,
    carreraId: string
  ): Promise<SeccionAsignatura[]> {
    const uri: string = "/estudiante/asignaturas/";
    const url: string = `${process.env.SIGA_API_URL}${uri}`;

    let res: AxiosResponse = await axios.post(
      url,
      qs.stringify({ token, carrera_id: carreraId }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Host: "siga.utem.cl",
        },
      }
    );

    let asignaturas: SeccionAsignatura[] = [];

    if (res.data.response?.length) {
      for (const asignaturaJson of res.data.response) {
        asignaturas.push({
          id: asignaturaJson.seccion_id,
          codigo: asignaturaJson.codigo_asignatura,
          nombre: asignaturaJson.nombre_asignatura,
          seccion: asignaturaJson.seccion,
          docente: asignaturaJson.profesor,
          tipoHora: asignaturaJson.tipo_hora,
          tipoAsignatura: asignaturaJson.tipo_asignatura,
          asistenciaAlDia: parseInt(asignaturaJson.asistencia_al_dia),
          horario: asignaturaJson.horario,
          sala: asignaturaJson.sala,
          intentos: asignaturaJson.intentos,
        });
      }
    }

    return asignaturas;
  }

  public static async getNotasAsignatura(
    token: string,
    carreraId: string,
    asignaturaId: string
  ): Promise<SeccionAsignatura> {
    const uri: string = "/estudiante/asignaturas/notas/";
    const url: string = `${process.env.SIGA_API_URL}${uri}`;

    let res: AxiosResponse = await axios.post(
      url,
      qs.stringify({ token, carrera_id: carreraId, seccion_id: asignaturaId }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Host: "siga.utem.cl",
        },
      }
    );

    let asignatura: SeccionAsignatura;
    if (res.data.response) {
      let asignaturaJson: any = res.data.response;
      if (res.data.response.length) {
        asignaturaJson = res.data.response[0];
      }
      let notasParciales: Evaluacion[] = [];
      if (asignaturaJson.notas_parciales) {
        asignaturaJson.notas_parciales.map((nota: any): Evaluacion => {
          return {
            descripcion: nota.descripcion,
            porcentaje: nota.ponderador,
            nota: nota.nota,
          };
        });
      }

      asignatura = {
        tipoHora: asignaturaJson.tipo_hora,
        notasParciales,
        notaExamen: asignaturaJson.nota_examen,
        notaPresentacion: asignaturaJson.nota_seccion_asignatura,
        notaFinal: asignaturaJson.nota_final_asignatura,
      };
    }

    return asignatura;
  }
}
