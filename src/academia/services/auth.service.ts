import { Cookie, Page, Request } from "puppeteer";
import { browser } from "../../app";
import GenericError from "../../infrastructure/models/error.model";

export class AcademiaUserService {
  public static async loginAndGetCookies(
    correo: string,
    contrasenia: string
  ): Promise<Cookie[]> {
    const usuarioInputSel: string = "input[name=username]";
    const contraseniaInputSel: string = "input[name=password]";
    const submitLoginSel: string = "input[name=login]";

    const page: Page = await browser.newPage();

    try {
      await page.setRequestInterception(true);
      page.on("request", (request: Request) => {
        if (["image", "stylesheet", "font"].includes(request.resourceType())) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.goto(`${process.env.ACADEMIA_UTEM_URL}/sso`, {
        waitUntil: "networkidle2",
      });

      await page.type(usuarioInputSel, correo);
      await page.type(contraseniaInputSel, contrasenia);
      await Promise.all([
        page.click(submitLoginSel),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);

      const url: string = await page.url();

      if (url.includes("sso.utem.cl")) {
        throw GenericError.CREDENCIALES_INCORRECTAS;
      }

      const cookies: Cookie[] = await page.cookies();
      return cookies;
    } catch (error) {
      throw error;
    } finally {
      page.close();
    }
  }
}
