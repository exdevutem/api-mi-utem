import { Cookie, Page } from "puppeteer";
import { browser } from "../../app";
import GenericError from "../../infrastructure/models/error.model";

export class MiUtemAuthService {
  public static async loginAndGetCookies(
    correo: string,
    contrasenia: string
  ): Promise<Cookie[]> {
    const usuarioInputSel = "input[name=username]";
    const contraseniaInputSel = "input[name=password]";
    const submitLoginSel = "input[name=login]";

    if (correo && correo.trim() != "" && contrasenia && contrasenia != "") {
      const page: Page = await browser.newPage(true);

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

        await page.goto(`${process.env.MI_UTEM_URL}`, {
          waitUntil: "networkidle2",
        });

        await page.type(usuarioInputSel, correo);
        await page.type(contraseniaInputSel, contrasenia);
        await Promise.all([
          page.click(submitLoginSel),
          page.waitForNavigation({ waitUntil: "networkidle2" }),
        ]);

        const url = await page.url();

        if (url.includes("sso.utem.cl")) {
          if (!url.includes("session_code=")) {
            console.log("token url", url);
            throw GenericError.CREDENCIALES_INCORRECTAS;
          } else {
            await page.goto(`${process.env.MI_UTEM_URL}`, {
              waitUntil: "networkidle2",
            });
            const url = await page.url();
          }
        }

        let cookies: Cookie[] = await page.cookies();
        return cookies;
      } catch (error) {
        throw error;
      } finally {
        page.close();
      }
    }
    throw GenericError.CREDENCIALES_INCORRECTAS;
  }
}
