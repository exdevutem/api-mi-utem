import Evaluacion from "../../core/models/evaluacion.model";
import SeccionAsignatura from "../../core/models/seccion-asignatura.model";
import Semestre from "../../core/models/semestre.model";
import Cookie from "../../infrastructure/models/cookie.model";
import {MiUtemAuthService} from "./auth.service";
import axios from "axios";
import * as cheerio from "cheerio";

export class MiUtemNotaService {
  public static async obtenerSeccionesHistoricas(cookies: Cookie[], soloNotas: boolean = true): Promise<SeccionAsignatura[] | Semestre[]> {
    await MiUtemAuthService.cookiesValidas(cookies); // No necesitamos las cookies, solo que sean válidas

    const notas = await axios.get(`${process.env.MI_UTEM_URL}/academicos/mi-bitacora-notas`, { // Obtiene el html de las notas.
      headers: {
        Cookie: cookies.map(it => it.raw).join(";"),
      }
    });
    const $ = cheerio.load(notas.data) // Carda el html

    const semestres: Semestre[] = [];
    $('#accordion > .div-card-notas').each((_, el) => {
      const secciones: SeccionAsignatura[] = []
      $(`div[id=${$(el).find('div > .card-notas').attr('data-target').replace('#', '')}]`).find('tbody > tr').each((_, columna) => {
        const notas: Evaluacion[] = []
        $(columna).find('td:nth-child(n+4):nth-last-child(n+4)').map((_, columna) => {
          const porcentaje = parseInt($(columna).find('.z > b').text().trim().replace('%', ''))
          const nota = parseFloat($(columna).find('.z > .x > .y').text().trim())
          return porcentaje || nota ? {porcentaje, nota} : null
        }).get().filter(it => it).forEach(it => notas.push(it))

        secciones.push({
          codigo: $(columna).find('td:nth-child(2)').text().split(' ')[0].trim().split(' ')[0],
          nombre: $(columna).find('td:nth-child(2)').text(),
          tipoHora: $(columna).find('td:nth-child(3)').text().trim(),
          estado: $(columna).find('td:last-child > input').hasClass('input_success') ? 'Aprobado' : $(columna).find('td:last-child > input').hasClass('input_danger') ? 'Reprobado' : 'Inscrito',
          notasParciales: notas,
          notaExamen: parseFloat($(columna).find('td:nth-last-child(2)').text().trim().replace(',', '.')),
          notaPresentacion: parseFloat($(columna).find('td:nth-last-child(3)').text().trim().replace(',', '.')),
          notaFinal: parseFloat($(columna).find('td:nth-last-child(1)').text().trim().replace(',', '.')),
        });
      })

      semestres.push({
        secciones,
      });
    });


    if (soloNotas) {
      let secciones: SeccionAsignatura[] = [];
      semestres.map((s) => {
        secciones = [...secciones, ...s.secciones];
      });
      return secciones;
    } else {
      return semestres;
    }
  }
}
