import { Browser, Page, Viewport } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import randomUseragent from "random-useragent";
import GenericError from "../models/error.model";
import GenericLogger from "../utils/logger.utils";

export default class MainBrowser {
  private browser: Browser | undefined;

  public constructor() {
    puppeteer.use(StealthPlugin());
    puppeteer
      .launch({
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--no-zygote",
          "--disk-cache-size=0",
          "--incognito",
        ],
        headless: true,
      })
      .then((browser) => {
        this.browser = browser;
        GenericLogger.log({
          level: "info",
          message: `🤖 Navegador cargado correctamente`,
        });
      });
  }

  public static get userAgent(): string {
    const randomUserAgent = randomUseragent.getRandom();
    const userAgent =
      randomUserAgent ||
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36";
    return userAgent;
  }

  public static get viewPort(): Viewport {
    return {
      width: 1920 + Math.floor(Math.random() * 100),
      height: 3000 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: false,
      isMobile: false,
    };
  }

  public static get ref(): string {
    return process.env.REQ_REF ? `?ref=${process.env.REQ_REF}` : "";
  }

  public async newPage(withNewContext: boolean = false): Promise<Page> {
    if (this.browser) {
      let page: Page;
      if (withNewContext) {
        const context = await this.browser.createIncognitoBrowserContext();
        page = await context.newPage();
      } else {
        page = await this.browser.newPage();
      }
      await page.setViewport(MainBrowser.viewPort);
      await page.setUserAgent(MainBrowser.userAgent);
      await page.setJavaScriptEnabled(true);
      await page.setDefaultNavigationTimeout(0);
      return page;
    }
    throw GenericError.BROWSER_NO_INICIALIZADO;
  }
}
