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

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// @ts-ignore
puppeteer.use(StealthPlugin());

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36";

const ref = process.env.REQ_REF ? `?ref=${process.env.REQ_REF}` : '';

const validarCorreo = (correo) => {
  const re = RegExp('[a-z0-9]+@[a-z]+\.[a-z]{2,3}')
  return re.test(correo)
};

const tokenMiUtem = (correo, contrasenia, browser) => {
  return new Promise(async (resolve, reject) => {
    try {
      const usuarioInputSel = "input[name=username]";
      const contraseniaInputSel = "input[name=password]";
      const submitLoginSel = "input[name=login]";
  
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
          request.continue();
        }
      });

      await page.goto(`${process.env.MI_UTEM_URL}${ref}`, { waitUntil: "networkidle2" });

      await page.type(usuarioInputSel, correo);
      await page.type(contraseniaInputSel, contrasenia);
      await Promise.all([
        page.click(submitLoginSel),
        page.waitForNavigation({ waitUntil: "networkidle2" })
      ]);

      const url = await page.url();
      
      if (url.includes("sso.utem.cl")) {
        if (!url.includes("session_code=")) {
          console.log("token url", url)
        reject(MiUtemError.CREDENCIALES_INCORRECTAS)
        } else {
          await page.goto(`${process.env.MI_UTEM_URL}${ref}`, { waitUntil: "networkidle2" });
        }
      }

      let jsonCookies = await page.cookies();
      resolve({
        sesion: jsonCookiesToStringSesion(jsonCookies),
      });
    } catch (error) {
      reject(error)
    }
  });
};

const profileFromMiUtem = (token, browser) => {
  return new Promise(async (resolve, reject) => {
    try {
      const estudiantePerfilSel =
        "body > div.page-container > div.header > div:nth-child(2) > div.search-link.d-lg-inline-block.d-none > div[value='Estudiante']";
      const notasButtonSel = "#btn-mdl-notas";

      const page = await browser.newPage();

      await page.setRequestInterception(true);
      await page.setJavaScriptEnabled(false);
      page.on("request", (request) => {
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

      // @ts-ignore
      const cookies = sesionStringToJsonCookies(token);
      await page.setCookie(...cookies);

      await page.goto(`${process.env.MI_UTEM_URL}${ref}`, { waitUntil: "networkidle2" });

      const url = await page.url();
      if (url.includes("sso.utem.cl")) {
        if (!url.includes("session_code=")) {
          reject(MiUtemError.CREDENCIALES_INCORRECTAS)
          } else {
            await page.goto(`${process.env.MI_UTEM_URL}${ref}`, { waitUntil: "networkidle2" });
          }
      } 

        const perfil = await page.evaluate((miUtemUrl) => {
          const tiposUsuarioSel =
            "body > div.page-container > div.header > div:nth-child(2) > div.search-link.d-lg-inline-block.d-none > div > span";
          const fotoPerfilSel = "body > div.page-container > div.header > div.d-flex.align-items-center > div.dropdown.pull-right > button > span > img";
          const nombreSel = "body > div.page-container > div.header > div.d-flex.align-items-center > div.pull-left.p-r-10.fs-14.font-heading.d-lg-block.d-none";
          const perfilSeleccionadoSel = "body > div.page-container > div.header > div.d-flex.align-items-center > div.pull-left.p-r-10.fs-14.font-heading.d-lg-block.d-none > p > strong";


          let fotoUrl = document.querySelector(fotoPerfilSel).getAttribute("src");
          if (fotoUrl.includes("default")) {
            fotoUrl = null;
          } else {
            fotoUrl = `${miUtemUrl}${fotoUrl}`;
          }

          const rut = parseInt(fotoUrl.replace(`${miUtemUrl}/static/interdocs/fotos/`, "").split(".")[0]);

          const perfilSeleccionado = document.querySelector(perfilSeleccionadoSel)?.textContent.trim();
          let nombreCompleto = document.querySelector(nombreSel)?.textContent;
          nombreCompleto = nombreCompleto.replace(perfilSeleccionado, "").trim();

          const tiposUsuarioEl = Array.from(
            document.querySelectorAll(tiposUsuarioSel)
          );
          const tiposUsuario = tiposUsuarioEl.map((t) => t.textContent);

          return {
            tiposUsuario,
            rut,
            nombreCompleto,
            fotoUrl
          };
        }, process.env.MI_UTEM_URL);
        resolve(perfil);
      
    } catch (error) {
      reject(error);
    }
  });
}

const profileFromAcademiaUtem = (correo, contrasenia, browser) => {
    return new Promise(async (resolve, reject) => {
      try {
        const usuarioInputSel = "input[name=username]";
        const contraseniaInputSel = "input[name=password]";
        const submitLoginSel = "input[name=login]";
    
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
            ["image", "stylesheet", "font"].includes(
              request.resourceType()
            )
          ) {
            request.abort();
          } else {
            request.continue();
          }
        });
  
        await page.goto(`${process.env.ACADEMIA_UTEM_URL}/sso`, { waitUntil: "networkidle2" });
  
        await page.type(usuarioInputSel, correo);
        await page.type(contraseniaInputSel, contrasenia);
        await Promise.all([
          page.click(submitLoginSel),
          page.waitForNavigation({ waitUntil: "networkidle2" })
        ]);
  
        const url = await page.url();
        
        if (url.includes("sso.utem.cl")) {
          
          reject(MiUtemError.CREDENCIALES_INCORRECTAS)
          
        }
  
        let jsonCookies = await page.cookies();
  
        resolve({
          sesion: jsonCookiesToStringSesion(jsonCookies),
        });
      } catch (error) {
        reject(error)
      }
    });

}

const profileFromKeycloakAccount = (correo, contrasenia, browser) => {
  return new Promise(async (resolve, reject) => {
    try {
      const usuarioInputSel = "input[name=username]";
      const contraseniaInputSel = "input[name=password]";
      const submitLoginSel = "input[name=login]";
      
      const userAgent = randomUseragent.getRandom();
      const UA = userAgent || USER_AGENT;
      const page = await browser.newPage();

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
          request.continue();
        }
      });

      await page.goto(`${process.env.SSO_UTEM_URL}/auth/realms/utem/account`, { waitUntil: "networkidle2" });

      await page.type(usuarioInputSel, correo);
      await page.type(contraseniaInputSel, contrasenia);
      await Promise.all([
        page.click(submitLoginSel),
        page.waitForNavigation({ waitUntil: "networkidle2" })
      ]);

      const url = await page.url();
      
      if (!url.includes("sso.utem.cl/auth/realms/utem/account/")) {
        if (!url.includes("session_code=")) {
          console.log("keyvloak url", url)
          reject(MiUtemError.CREDENCIALES_INCORRECTAS)
        } else {
          await page.goto(`${process.env.MI_UTEM_URL}/auth/realms/utem/account/`, { waitUntil: "networkidle2" });
        }
      }

      const perfil = await page.evaluate(() => {
        const emailInputSel = "#email";
        const firstNameInputSel = "#firstName";
        const lastNameInputSel = "#lastName";

        const correo = document.querySelector(emailInputSel)?.getAttribute("value").trim().toLowerCase();
        const nombres = document.querySelector(firstNameInputSel)?.getAttribute("value").trim();
        const apellidos = document.querySelector(lastNameInputSel)?.getAttribute("value").trim();

        return {
          correo,
          nombres,
          apellidos
        };
      });

      resolve(perfil);
    } catch (error) {
      reject(error);
    }
  });
};

const resetPassword = (correo, browser) => {
    return new Promise(async (resolve, reject) => {  
      try {
        const correoInputSel = "#email";
        const submitButtonSel = "#btnld";
        
        const userAgent = randomUseragent.getRandom();
        const UA = userAgent || USER_AGENT;
        const page = await browser.newPage();
  
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
            request.continue();
          }
        });
        
        await page.goto(`${process.env.MI_UTEM_URL}/reset`, { waitUntil: "networkidle2" });
  
        await page.type(correoInputSel, correo);
        await Promise.all([
          page.click(submitButtonSel),
          page.waitForNavigation({ waitUntil: "networkidle2" })
        ]);

        const result = await page.evaluate(() => {
          const alertSel = "body > div > div > div > section > div.alert";
  
          const alertEl = document.querySelector(alertSel);

          const enviado = alertEl.classList.contains("alert-success");
          const mensaje = alertEl.textContent.split("\n").map(e => e.trim()).join(" ").trim();
  
          return {
            enviado,
            mensaje
          };
        });
  
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
}

const changeMiUtemImage = (cookies, image, browser) => {
  return new Promise(async (resolve, reject) => {
    try {
      const csrfmiddlewaretokenInputSel = "input[name='csrfmiddlewaretoken']";
      
      const userAgent = randomUseragent.getRandom();
      const UA = userAgent || USER_AGENT;
      const page = await browser.newPage();

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
          request.continue();
        }
      });

      await page.setCookie(...cookies);
      await page.goto(`${process.env.MI_UTEM_URL}${ref}`, { waitUntil: "networkidle2" });

      try {
        await page.waitForSelector(csrfmiddlewaretokenInputSel, {
          timeout: 5000,
        });
      } catch (error) {
        const url = await page.url();
        if (url.startsWith(`${process.env.MI_UTEM_URL}`)) {
          reject(error);
        } else {
          reject(MiUtemError.SESION_EXPIRADA);
        }
      }

      const csrfmiddlewaretoken = await page.evaluate(() => {
        const csrfmiddlewaretokenInputSel = "input[name='csrfmiddlewaretoken']";

        const csrfmiddlewaretoken = document.querySelector(csrfmiddlewaretokenInputSel).getAttribute("value");

        return csrfmiddlewaretoken;
      });

      const sessionId = cookies.find(e => e.name == "sessionid").value;
      const csrfToken = cookies.find(e => e.name == "csrftoken").value;

      const { file, filename } = await base64ToFile(image);

      const formData = new FormData();
      formData.append("csrfmiddlewaretoken", csrfmiddlewaretoken);
      formData.append("picture", file, {filename});

      let res = await axios.post(
        `${process.env.MI_UTEM_URL}/users/do_set_imagen_perfil`,
        formData,
        {
          headers: {
            ...{
              "X-Requested-With": "XMLHttpRequest",
              "Cookie": `csrftoken=${csrfToken}; sessionid=${sessionId}; MIUTEM=miutem1`
            },
            ...formData.getHeaders(),
          }
        }
      );
      resolve({
        cambiado: res.data.status == 1,
        fotoUrl: `${process.env.MI_UTEM_URL}` + res.data.prs_ruta_foto
      });
    } catch (error) {
      reject(error);
    }
  });
}

const doLoginAndGetProfile = async (req, res, next) => {
  let browser = null;
  try {

    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
      headless: true,
    });

    const respuestaPromesas = await Promise.all([
      tokenMiUtem(req.body.usuario, req.body.contrasenia, browser),
      //profileFromKeycloakAccount(req.body.usuario, req.body.contrasenia, browser),
    ]);

    let perfil = {
      ...respuestaPromesas[0],
      ...respuestaPromesas[1]
    }

    const miUtem = await profileFromMiUtem(perfil.sesion, browser);
    perfil = {
      ...perfil,
      ...miUtem,
      ...{
        correo: req.body.usuario
      }
    };

    if (perfil.tiposUsuario.length) {
      if (perfil.tiposUsuario.includes("Estudiante")) {
        
        res.status(200).json(perfil);
      } else {
        next(MiUtemError.NO_ESTUDIANTE);
      }
    } else {
      next(MiUtemError.SIN_ROL);
    }
    
  } catch (error) {
    next(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

const refreshToken = async (req, res, next) => {
  let browser = null;
  try {

    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
      headless: true,
    });
    const sesion = await tokenMiUtem(req.body.usuario, req.body.contrasenia, browser);
    
    res.status(200).json(sesion);
  } catch (error) {
    next(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

const getProfile = async (req, res, next) => {
  let browser = null;
  try {

    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
      headless: true,
    });
    const resultado = await Promise.all([
      profileFromKeycloakAccount(req.body.usuario, req.body.contrasenia, browser),
      //tokenMiUtem(req.body.usuario, req.body.contrasenia, browser),
      //profileFromAcademiaUtem(req.body.usuario, req.body.contrasenia, browser)
    ]);

    res.status(200).json(resultado[0]);
  } catch (error) {
    next(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

const doChangeImage = async (req, res, next) => {
  let browser = null;
  try {

    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
      headless: true,
    });

    const result = await changeMiUtemImage(req.cookies, req.body.imagen, browser);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

const doResetPassword = async (req, res, next) => {
  let browser = null;
  try {

    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
      headless: true,
    });

    const result = await resetPassword(req.body.usuario, browser);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};



module.exports = { doLoginAndGetProfile, doResetPassword, refreshToken, getProfile, doChangeImage, validarCorreo };
