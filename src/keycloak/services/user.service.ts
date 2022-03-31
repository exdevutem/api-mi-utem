import { Page, Request } from "puppeteer";
import { browser } from "../../app";
import GenericError from "../../infrastructure/models/error.model";

export class KeycloakUserService {
  public static async getProfile(
    correo: string,
    contrasenia: string
  ): Promise<any> {
    const usuarioInputSel: string = "input[name=username]";
    const contraseniaInputSel: string = "input[name=password]";
    const submitLoginSel: string = "input[name=login]";

    const page: Page = await browser.newPage();

    try {
      await page.setRequestInterception(true);
      page.on("request", (request: Request) => {
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

      await page.goto(`${process.env.SSO_UTEM_URL}/auth/realms/utem/account`, {
        waitUntil: "networkidle2",
      });

      await page.type(usuarioInputSel, correo);
      await page.type(contraseniaInputSel, contrasenia);
      await Promise.all([
        page.click(submitLoginSel),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);

      const url: string = await page.url();
      if (!url.includes("sso.utem.cl/auth/realms/utem/account/")) {
        if (!url.includes("session_code=")) {
          console.log("keyvloak url", url);
          throw GenericError.CREDENCIALES_INCORRECTAS;
        } else {
          await page.goto(
            `${process.env.MI_UTEM_URL}/auth/realms/utem/account/`,
            { waitUntil: "networkidle2" }
          );
        }
      }

      const perfil: {
        correo: string;
        nombres: string;
        apellidos: string;
      } = await page.evaluate(() => {
        const emailInputSel = "#email";
        const firstNameInputSel = "#firstName";
        const lastNameInputSel = "#lastName";

        const correo = document
          .querySelector(emailInputSel)
          ?.getAttribute("value")
          .trim()
          .toLowerCase();
        const nombres = document
          .querySelector(firstNameInputSel)
          ?.getAttribute("value")
          .trim();
        const apellidos = document
          .querySelector(lastNameInputSel)
          ?.getAttribute("value")
          .trim();

        return {
          correo,
          nombres,
          apellidos,
        };
      });

      return perfil;
    } catch (error) {
      throw error;
    } finally {
      page.close();
    }
  }
}
