import axios, { AxiosResponse } from "axios";
import * as cheerio from 'cheerio';
import FormData from "form-data";
import Usuario from "../../core/models/usuario.model";
import Cookie from "../../infrastructure/models/cookie.model";
import FilesUtils from "../../infrastructure/utils/files.utils";
import { MiUtemAuthService } from "./auth.service";

export class MiUtemUserService {
  public static async changeProfilePicture(cookies: Cookie[], base64Image: string) {
    await MiUtemAuthService.cookiesValidas(cookies);
    const sessionId: string = cookies.find(it => it.name === 'sessionid').value;
    const csrfToken: string = cookies.find(it => it.name === 'csrftoken').value;

    const { file, filename } = await FilesUtils.base64ToFile(base64Image);

    const formData = new FormData();
    formData.append("csrfmiddlewaretoken", csrfToken);
    formData.append("picture", file, filename);

    let res: AxiosResponse = await axios.post(
      `${process.env.MI_UTEM_URL}/users/do_set_imagen_perfil`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          ...{
            "X-Requested-With": "XMLHttpRequest",
            Host: "mi.utem.cl",
            Cookie: `MIUTEM=miutem1; csrftoken=${csrfToken}; sessionid=${sessionId}`,
          },
        },
      }
    );
    return {
      cambiado: res.data.status == 1,
      fotoUrl: `${process.env.MI_UTEM_URL}` + res.data.prs_ruta_foto,
    };
  }

  public static async getProfile(cookies: Cookie[]): Promise<Usuario> {
    await MiUtemAuthService.cookiesValidas(cookies)

    const perfil = await axios.get(`${process.env.MI_UTEM_URL}/academicos/mi-perfil-estudiante`, {
      headers: {
        Cookie: Cookie.header(cookies),
      },
    })

    const $ = cheerio.load(perfil.data)
    const perfiles = []
    $('body > div.page-container > div.header > div:nth-child(2) > div.search-link.d-lg-inline-block.d-none > div > span').each((i, el) => {
      perfiles.push($(el).text())
    })
    const fotoUrl = $('#user_picture').attr('src').includes('default') ? null : $('#user_picture').attr('src');

    return {
      perfiles,
      rut: parseInt(fotoUrl?.replace(`${process.env.Mi_UTEM_URL}/static/interdocs/fotos/`, '').split('.')[0]),
      nombreCompleto: $('body > div.page-container > div.header > div.d-flex.align-items-center > div.pull-left.p-r-10.fs-14.font-heading.d-lg-block.d-none').text().replace($('body > div.page-container > div.header > div.d-flex.align-items-center > div.pull-left.p-r-10.fs-14.font-heading.d-lg-block.d-none > p > strong').text().trim(), '').trim(),
      fotoUrl: fotoUrl,
    };
  }
}
