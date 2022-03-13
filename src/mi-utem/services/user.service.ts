import axios, { AxiosResponse } from "axios";
import FormData from "form-data";
import { Page, Request, SetCookie } from "puppeteer";
import { browser } from "../../app";
import Usuario from "../../core/models/usuario.model";
import GenericError from "../../infrastructure/models/error.model";
import FilesUtils from "../../infrastructure/utils/files.utils";

export class MiUtemUserService {
  public static async getProfile(cookies: SetCookie[]): Promise<Usuario> {
    const page: Page = await browser.newPage();

    try {
      await page.setJavaScriptEnabled(false);

      await page.setRequestInterception(true);
      page.on("request", (request: Request) => {
        if (
          ["stylesheet", "font", "script", "other", "xhr", "image"].includes(
            request.resourceType()
          )
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.setCookie(...cookies);

      await page.goto(`${process.env.MI_UTEM_URL}`, {
        waitUntil: "networkidle2",
      });

      const url: string = await page.url();
      if (url.includes("sso.utem.cl")) {
        if (!url.includes("session_code=")) {
          throw GenericError.CREDENCIALES_INCORRECTAS;
        } else {
          await page.goto(`${process.env.MI_UTEM_URL}`, {
            waitUntil: "networkidle2",
          });
        }
      }

      const usuario: Usuario = await page.evaluate((miUtemUrl: string) => {
        const tiposUsuarioSel =
          "body > div.page-container > div.header > div:nth-child(2) > div.search-link.d-lg-inline-block.d-none > div > span";
        const fotoPerfilSel =
          "body > div.page-container > div.header > div.d-flex.align-items-center > div.dropdown.pull-right > button > span > img";
        const nombreSel =
          "body > div.page-container > div.header > div.d-flex.align-items-center > div.pull-left.p-r-10.fs-14.font-heading.d-lg-block.d-none";
        const perfilSeleccionadoSel =
          "body > div.page-container > div.header > div.d-flex.align-items-center > div.pull-left.p-r-10.fs-14.font-heading.d-lg-block.d-none > p > strong";

        let fotoUrl = document.querySelector(fotoPerfilSel).getAttribute("src");
        if (fotoUrl.includes("default")) {
          fotoUrl = null;
        } else {
          fotoUrl = `${miUtemUrl}${fotoUrl}`;
        }

        const rut = parseInt(
          fotoUrl
            .replace(`${miUtemUrl}/static/interdocs/fotos/`, "")
            .split(".")[0]
        );

        const perfilSeleccionado = document
          .querySelector(perfilSeleccionadoSel)
          ?.textContent.trim();
        let nombreCompleto = document.querySelector(nombreSel)?.textContent;
        nombreCompleto = nombreCompleto.replace(perfilSeleccionado, "").trim();

        const tiposUsuarioEl = Array.from(
          document.querySelectorAll(tiposUsuarioSel)
        );
        const perfiles = tiposUsuarioEl.map((t) => t.textContent);

        return {
          perfiles,
          rut,
          nombreCompleto,
          fotoUrl,
        };
      }, process.env.MI_UTEM_URL);

      return usuario;
    } catch (error) {
      throw error;
    } finally {
      page.close();
    }
  }

  public static async changeProfilePicture(
    cookies: SetCookie[],
    base64Image: string
  ) {
    const csrfmiddlewaretokenInputSel: string =
      "input[name='csrfmiddlewaretoken']";

    const page: Page = await browser.newPage();

    try {
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        if (
          ["image", "stylesheet", "font", "other", "xhr", "script"].includes(
            request.resourceType()
          )
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.setCookie(...cookies);
      await page.goto(`${process.env.MI_UTEM_URL}`, {
        waitUntil: "networkidle2",
      });

      try {
        await page.waitForSelector(csrfmiddlewaretokenInputSel, {
          timeout: 5000,
        });
      } catch (error) {
        const url = await page.url();
        if (url.startsWith(`${process.env.MI_UTEM_URL}`)) {
          throw error;
        } else {
          throw GenericError.MI_UTEM_EXPIRO;
        }
      }

      const csrfmiddlewaretoken: string = await page.evaluate(() => {
        const csrfmiddlewaretokenInputSel = "input[name='csrfmiddlewaretoken']";

        const csrfmiddlewaretoken = document
          .querySelector(csrfmiddlewaretokenInputSel)
          .getAttribute("value");

        return csrfmiddlewaretoken;
      });

      const sessionId: string = cookies.find(
        (e) => e.name == "sessionid"
      ).value;
      const csrfToken: string = cookies.find(
        (e) => e.name == "csrftoken"
      ).value;

      const { file, filename } = await FilesUtils.base64ToFile(base64Image);

      const formData = new FormData();
      formData.append("csrfmiddlewaretoken", csrfmiddlewaretoken);
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
    } catch (error) {
      console.log(error.response.data);
      throw error;
    } finally {
      page.close();
    }
  }
}
