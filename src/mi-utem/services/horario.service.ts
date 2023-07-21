import Horario from "../../core/models/horario.model";
import GenericError from "../../infrastructure/models/error.model";
import {MiUtemAuthService} from "./auth.service";
import Cookie from "../../infrastructure/models/cookie.model";
import axios from "axios";
import * as cheerio from "cheerio";

export class MiUtemHorarioService {
  public static async getHorarioByCarrera(cookies: Cookie[], codigoCarrera: string): Promise<Horario> {
    await MiUtemAuthService.cookiesValidas(cookies)

    const page = await axios.get(`${process.env.MI_UTEM_URL}/academicos/mi-horario`, { // Obtiene el html de las notas.
      headers: {
        Cookie: cookies.map(it => it.raw).join(";"),
      }
    });

    const $ = cheerio.load(page.data)

    const tablaHorario = $('#accordion').find('table.tabla-horario-rounded')

    if (tablaHorario.length == 0) {
      throw GenericError.HORARIO_NO_ENCONTRADO
    }

    const tablaAsignaturas = $("#tabla-cursos-dictados")

    const asignaturas = [];
    $(tablaAsignaturas).find('tbody tr').each((i, tr) => {
      const tds = $(tr).find('td')
      asignaturas.push({
        codigo: $(tds[0]).text().trim(),
        nombre: $(tds[1]).text().trim(),
        docente: $(tds[2]).text().trim(),
        tipoHora: $(tds[3]).text().trim(),
        seccion: $(tds[4]).text().trim(),
      })
    });

    const dias = []
    // Solo desde la columna #2 al final
    $(tablaHorario).find('thead th:nth-child(n+3)').each((i, th) => {
      dias.push($(th).text().trim())
    });

    const horario = []
    $(tablaHorario).find('tbody tr').each((i, tr) => {
      const tds = $(tr).find('td')
      const columnasDias = tds.slice(2);
      columnasDias.each((j, bloque) => {
        const bloqueTexto = $(bloque).text().trim();
        if (!horario[j]) {
          horario[j] = [];
        }
        if (bloqueTexto && bloqueTexto != null) {
          const codigoTipoHora = bloqueTexto?.split("Sala:")[0]?.trim();
          const codigo = codigoTipoHora?.split("/")[0].trim();
          const tipoHora = codigoTipoHora?.split("/")[1]?.trim();

          const seccionSala = bloqueTexto?.split("Sala:")[1]?.trim();
          const seccion = seccionSala?.split("(")[0]?.trim();
          const sala = seccionSala
            ?.split("(")[1]
            .replace(")", "")
            ?.trim();

          horario[j].push({asignatura: {tipoHora, codigo, seccion}, sala});
        } else {
          horario[j].push(null);
        }
      });
    });

    const periodos = []
    $(tablaHorario).find('tbody tr:nth-child(odd)').each((i, tr) => {
      const tds = $(tr).find('td')
      const periodo = $(tds[0]).text().trim()
      const horaInicio = $(tds[1]).text().trim()?.split("-")[0];
      const horaIntermedio = $(tds[1]).text().trim()?.split("-")[1];
      const horaTermino = $(tds[1]).text().trim()?.split("-")[1];

      periodos.push({
        numero: periodo,
        horaInicio,
        horaIntermedio,
        horaTermino,
      })
    });

    return {asignaturas, horario, dias, periodos}
  }
}
