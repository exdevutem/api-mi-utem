import { Page, Request } from "puppeteer";
import { browser } from "../../app";

export class PasaportePasswordService {
  public static async resetPassword(correo: string): Promise<{
    enviado: boolean;
    mensaje: string;
  }> {
    const correoInputSel: string = "#email";
    const submitButtonSel: string = "#btnld";

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

      await page.goto(`${process.env.PASAPORTE_UTEM_URL}/reset`, {
        waitUntil: "networkidle2",
      });

      await page.type(correoInputSel, correo);
      await Promise.all([
        page.click(submitButtonSel),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);

      const result: {
        enviado: boolean;
        mensaje: string;
      } = await page.evaluate(() => {
        const alertSel = "body > div > div > div > section > div.alert";

        const alertEl = document.querySelector(alertSel);

        const enviado = alertEl.classList.contains("alert-success");
        const mensaje = alertEl.textContent
          .split("\n")
          .map((e) => e.trim())
          .join(" ")
          .trim();

        return {
          enviado,
          mensaje,
        };
      });

      return result;
    } catch (error) {
      throw error;
    } finally {
      page.close();
    }
  }
}
