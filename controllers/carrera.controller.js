// @ts-nocheck
require("dotenv").config();

const axios = require("axios").default;
const puppeteer = require("puppeteer-extra");
const FormData = require('form-data');
const randomUseragent = require("random-useragent");

const MiUtemError = require("../utils/errors")

// @ts-ignore
const {
  sesionStringToJsonCookies,
  jsonCookiesToStringSesion,
} = require("../utils/cookies");

const {
  base64ToFile
} = require("../utils/files");

const ref = process.env.REQ_REF ? `?ref=${process.env.REQ_REF}` : '';

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// @ts-ignore
puppeteer.use(StealthPlugin());

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36";

const carreras = (cookies, browser) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userAgent = randomUseragent.getRandom();
        const UA = userAgent || USER_AGENT;
        
        const page = await browser.newPage();
  
        await page.setViewport({
          width: 1920 + Math.floor(Math.random() * 100),
          height: 3000 + Math.floor(Math.random() * 100),
          deviceScaleFactor: 1,
          hasTouch: false,
          isLandscape: false,
          isMobile: false,
        });
  
        await page.setUserAgent(UA);
        await page.setJavaScriptEnabled(true);
        await page.setDefaultNavigationTimeout(0);
  
        await page.setRequestInterception(true);
        page.on("request", (request) => {
          if (
            ["image", "stylesheet", "font", "other", "xhr", "script"].includes(
              request.resourceType()
            )
          ) {
            request.abort();
          } else {
            //console.log(request.resourceType(), request.url());
            request.continue();
          }
        });
  
        await page.setCookie(...cookies);

        await page.goto(`${process.env.MI_UTEM_URL}/academicos/mi-malla${ref}`, { waitUntil: "networkidle2" });
  
        const url = await page.url();
        
        if (url.includes("sso.utem.cl")) {
          reject(MiUtemError.SESION_EXPIRADA)
        } else {
          const carreras = await page.evaluate(() => {
            const carrerasCardSel =
              "#avance-malla > #accordion > div.div-card-avance";
            const carrerasCollapsableSel =
              "#avance-malla > #accordion > div.collapse";
    
            const carrerasCardEl = Array.from(
              document.querySelectorAll(carrerasCardSel)
            );
            const carreraCollapsableEl = Array.from(
              document.querySelectorAll(carrerasCollapsableSel)
            );
    
            
            const carreras = carrerasCardEl.map((carreraCardEl, i) => {
              const nombreCodigosel = "div > div > span.card-avance-left";
              const estadoSel = "div > div > span.card-avance-right";
              const planSel = "div > div:nth-child(1) > div > table > tbody > tr:nth-child(1) > td:nth-child(3)";
    
              const nombreCodigoEl = carreraCardEl.querySelector(nombreCodigosel);
              const estadoEl = carreraCardEl.querySelector(estadoSel);
              const collapsableEl = carreraCollapsableEl[i];
              
              const codigo = nombreCodigoEl.textContent.split(" - ")[0].trim();
              const nombre = nombreCodigoEl.textContent.split(" - ")[1].trim();
              const estado = estadoEl.textContent.replace("Estado : ", "").trim();
              const plan = collapsableEl.querySelector(planSel).textContent.trim();
    
              return {
                  codigo,
                  nombre,
                  estado,
                  plan
              };
            });
            
      
            return {
              carreras
            };
          });
      
          resolve(carreras);
        }
      } catch (error) {
        reject(error)
      }
    });
  };
  
  const carreraActiva = (cookies, browser) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userAgent = randomUseragent.getRandom();
        const UA = userAgent || USER_AGENT;
        
        const page = await browser.newPage();
  
        await page.setViewport({
          width: 1920 + Math.floor(Math.random() * 100),
          height: 3000 + Math.floor(Math.random() * 100),
          deviceScaleFactor: 1,
          hasTouch: false,
          isLandscape: false,
          isMobile: false,
        });
  
        await page.setUserAgent(UA);
        await page.setJavaScriptEnabled(false);
        await page.setDefaultNavigationTimeout(0);
  
        await page.setRequestInterception(true);
        page.on("request", (request) => {
          if (
            ["image", "stylesheet", "font", "other", "xhr", "script"].includes(
              request.resourceType()
            )
          ) {
            request.abort();
          } else {
            //console.log(request.resourceType(), request.url());
            request.continue();
          }
        });
  
        await page.setCookie(...cookies);

        await page.goto(`${process.env.MI_UTEM_URL}/academicos/mis-certificados${ref}`, { waitUntil: "networkidle2" });
  
        const url = await page.url();
        
        if (url.includes("sso.utem.cl")) {
          reject(MiUtemError.SESION_EXPIRADA)
        } else {
          const carrera = await page.evaluate(() => {
            const carreraNombreSel = "body > div.page-container > div.page-content-wrapper > div.content.sm-gutter > div > div.container-fixed-lg > div > div > div > div.card-body > div.row.p-l-10.p-r-10 > div > div > div > table > tbody > tr.shadow.odd > td:nth-child(6)";
            const carreraEstadoSel = "body > div.page-container > div.page-content-wrapper > div.content.sm-gutter > div > div.container-fixed-lg > div > div > div > div.card-body > div.row.p-l-10.p-r-10 > div > div > div > table > tbody > tr.shadow.odd > td:nth-child(3)";
    
            const nombre = document.querySelector(carreraNombreSel)?.textContent.trim();
            const estado = document.querySelector(carreraEstadoSel)?.textContent.trim();
      
            return {
              nombre,
              estado
            };
          });
      
          resolve(carrera);
        }
      } catch (error) {
        reject(error)
      }
    });
  };

const getCarreras = async (req, res, next) => {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
      headless: true,
    });

    const result = await carreras(req.cookies, browser);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

const getCarrerasActiva = async (req, res, next) => {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
      headless: true,
    });

    const result = await carreraActiva(req.cookies, browser);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};
  

module.exports = { getCarreras, getCarrerasActiva };