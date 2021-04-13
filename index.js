// @ts-nocheck
require('dotenv').config()

const fs = require("fs");
const bodyParser = require("body-parser");
const express = require("express");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const stream = require('stream');
const readline = require("readline");
const router = require("./routes/routes");
const morgan = require("morgan");
const MiUtemError = require("./utils/errors");
const http = require('http');
const https = require('https');

const app = express();
const { logger } = require("./utils/logger");

app.use(bodyParser.json({limit: '50mb'}));

const winstonMorgarWriter = new stream.Writable()
winstonMorgarWriter._write = function (chunk, encoding, done) {
  logger.log({
    level: "http",
    message: chunk.toString()
  });
  done();
};

Sentry.init({
  dsn: process.env.SENTRY_URL,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// @ts-ignore
String.prototype.toTitleCase = function () {
  return this.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

app.use(morgan("short", {
  stream: winstonMorgarWriter
}));

app.use(morgan("dev"));


// @ts-ignore
app.get("/", (req, res) => {
  res.json({
    funcionando: true,
    estado: "API funcionando correctamente en el nuevo servidor",
  });
});

app.use("/v1", router);

app.use(Sentry.Handlers.errorHandler());

// @ts-ignore
app.use(function onError(err, req, res, next) {
  logger.log({
    level: "error",
    message: err.stack
  });
  if (err instanceof MiUtemError) {
    res.statusCode = err.statusCode;
    res.json({
      codigoHttp: err.statusCode ? err.statusCode : 500,
      mensaje: err.message ? err.message : "Error inesperado",
      codigoInterno: err.internalCode ? err.internalCode : 0,
      error: err.toString(),
    });
  } else {
    res.statusCode = 500;
    res.json({
      codigoHttp: 500,
      mensaje: "Error inesperado",
      codigoInterno: 0,
      error: err.toString(),
    });
  }
  
});

let privateKey;
let certificate;
let intermediates = [];
try {
  if (process.env.PRIVATE_KEY_PATH && process.env.CERTIFICATE_PATH) {
    privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH);
    certificate = fs.readFileSync(process.env.CERTIFICATE_PATH);
    if (process.env.INTERMEDIATE_PATH) {
      intermediates = [fs.readFileSync(process.env.INTERMEDIATE_PATH)]
    }
  }
} catch (error) {
  logger.log({
    level: 'warn',
    message: `Error al cargar los certificados HTTPS: ${error}`
  });
}

let puerto = process.env.PORT || 3000;
if (privateKey && certificate) {
  let credentials = {key: privateKey, cert: certificate, ca: intermediates};
  let httpsServer = https.createServer(credentials, app);
  httpsServer.listen(puerto, async () => {
    logger.log({
      level: 'info',
      message: `🚀 Servidor HTTPS escuchando en el puerto ${puerto}`
    });
  });
} else {
  let httpServer = http.createServer(app); 
  httpServer.listen(puerto, async () => {
    logger.log({
      level: 'info',
      message: `🚀 Servidor HTTP escuchando en el puerto ${puerto}`
    });
  });
}
