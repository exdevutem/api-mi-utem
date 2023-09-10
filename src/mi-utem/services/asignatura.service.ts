import SeccionAsignatura from "../../core/models/seccion-asignatura.model";
import Usuario from "../../core/models/usuario.model";
import GenericError from "../../infrastructure/models/error.model";
import Cookie from "../../infrastructure/models/cookie.model";
import {MiUtemAuthService} from "./auth.service";
import axios from "axios";
import * as cheerio from "cheerio";

export class MiUtemAsignaturaService {
  public static async getAsignaturas(cookies: Cookie[]): Promise<SeccionAsignatura[]> {
    await MiUtemAuthService.cookiesValidas(cookies);

    const page = await axios.get(process.env.MI_UTEM_URL, {
      headers: {
        Cookie: Cookie.header(cookies),
      }
    })

    const $ = cheerio.load(page.data);
    const asignaturas: SeccionAsignatura[] = [];

    $('.card-utem #table_mdl_titulo tbody tr.no-border').each((_, el) => {
      asignaturas.push({
        codigo: $(el).find('td:nth-child(1) > span').text().split(' - ')[0].trim(),
        nombre: $(el).find('td:nth-child(1) > span').text().split(' - ')[1].trim(),
        tipoHora: $(el).find('td:nth-child(2)').text().trim(),
      })
    });

    return asignaturas;
  }

  /**
   * Obtiene el detalle de una asignatura del usuario
   * @param cookies las cookies de MiUTEM
   * @param codigoAsignatura el codigo en formato por ejemplo 'MATC8020' para Álgebra Clásica.
   * @param esLaboratiorio si es laboratorio o no. Por defecto es falso.
   */
  public static async getDetalleAsignatura(cookies: Cookie[], codigoAsignatura: string, esLaboratiorio: boolean = false): Promise<SeccionAsignatura> {
    const [_, csrftoken] = await MiUtemAuthService.cookiesValidas(cookies);

    // El uso se encuentra acá: https://mi.utem.cl/static/js/home/home_alumnos.js (línea 52, #showDetails)
    const page = await axios.get(process.env.MI_UTEM_URL, {
      headers: {
        Cookie: Cookie.header(cookies),
      }
    });

    const $ = cheerio.load(page.data);

    let onclick: string = null;

    $('.card-utem #table_mdl_titulo tbody tr.no-border').each((i, el) => {
      if($(el).find('td:nth-child(1) > span').text().split(' - ')[0].trim().toUpperCase() === codigoAsignatura.toUpperCase() && $(el).find('td:nth-child(2) > span').text().toLowerCase().includes(esLaboratiorio ? 'laboratorio' : 'teoria')) {
        onclick = $(el).find('span[onclick]').attr('onclick')
      }
    });

    const asignaturaNoEncontrada = GenericError.ASIGNATURA_NO_ENCONTRADA

    if(!onclick) {
      asignaturaNoEncontrada.internalCode = 6.1;
      throw asignaturaNoEncontrada;
    }
    const dato = onclick.replace('showDetails(', '').replace(')', '').split(',').map((el) => el.replace(/'/g, ''));
    if(dato.length !== 5) {
      asignaturaNoEncontrada.internalCode = 6.2;
      throw asignaturaNoEncontrada;
    }

    const detalleAsignatura = await axios.post(`${process.env.MI_UTEM_URL}/academicos/get-data-detalle-asignatura`, `csrfmiddlewaretoken=${csrftoken}&scn_id_e=${dato[0]}&asn_id_e=${dato[1]}&mnemonic=${dato[2]}&horario=${dato[3]}&tph_desc=${dato[4]}`, {
      headers: {
        Cookie: Cookie.header(cookies),
        Referer: process.env.MI_UTEM_URL,
        Host: process.env.MI_UTEM_HOST,
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    const $detalleAsignatura = cheerio.load(detalleAsignatura.data);
    let docente = $detalleAsignatura('#TABLA1 > div:nth-child(1) > div > div > div > div > div:nth-child(2) > span').html().trim()
    if(docente.includes(' - ') && !isNaN(Number.parseInt(docente.split(' - ')[0]))) {
      docente = docente.split(' - ')[1].trim()
    }
    let asistenciaSinRegistro = parseInt($detalleAsignatura('#clas_noreg').text().trim());
    asistenciaSinRegistro = asistenciaSinRegistro >= 0 ? asistenciaSinRegistro : 0;
    let asistenciaAsistida = parseInt($detalleAsignatura('#clas_asi').text().trim());
    asistenciaAsistida = asistenciaAsistida >= 0 ? asistenciaAsistida : 0;
    let asistenciaTotal = parseInt($detalleAsignatura('#clas_total').text().trim());
    asistenciaTotal = asistenciaTotal >= 0 ? asistenciaTotal : 0;

    const estudiantes: Usuario[] = [];
    $detalleAsignatura('#table-estudiantes > tbody > tr').each((_, el) => {
      const nombre = $detalleAsignatura(el).find('td:nth-child(2)').text().trim();
      let nombreCompleto, nombres, apellidos: string
      if(nombre.includes(',')) {
        nombres = nombre.split(',')[1].trim();
        apellidos = nombre.split(',')[0].trim();
      } else {
        nombreCompleto = nombre.trim()
      }
      const correoUtem = $detalleAsignatura(el).find('td:nth-child(3)').text().trim();
      estudiantes.push({ nombreCompleto, nombres, apellidos, correoUtem })
    });

    return {
      docente: docente == "None" ? null : docente,
      tipoAsignatura: $detalleAsignatura('#TABLA1 > div:nth-child(1) > div > div:nth-child(2) > div > div > div:nth-child(2) > span').text().trim(),
      tipoHora: $detalleAsignatura('#TABLA1 > div:nth-child(1) > div > div:nth-child(3) > div > div > div:nth-child(2) > span').text().trim(),
      horario: $detalleAsignatura('#TABLA1 > div:nth-child(1) > div > div:nth-child(4) > div > div > div.col-lg-10.text-uppercase').text().split('/').map(e => e.trim()).filter(e => e && e.length > 0).join(' / ').trim(),
      intentos: parseInt($detalleAsignatura('#TABLA1 > div:nth-child(1) > div > div > div > div > div:nth-child(4) > span').text().trim()),
      sala: $detalleAsignatura('#TABLA1 > div:nth-child(1) > div > div:nth-child(2) > div > div > div:nth-child(4) > span').text().trim(),
      seccion: $detalleAsignatura('#TABLA1 > div:nth-child(1) > div > div:nth-child(3) > div > div > div:nth-child(4) > span').text().trim(),
      estudiantes,
      asistencia: {
        total: asistenciaTotal,
        asistida: asistenciaAsistida,
        sinRegistro: asistenciaSinRegistro,
      },
    }
  }
}
