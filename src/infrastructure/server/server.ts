import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import bodyParser from "body-parser";
import express, {NextFunction, Request, Response} from "express";
import {readFileSync} from "fs";
import http from "http";
import https from "https";
import morgan from "morgan";
import stream from "stream";
import CoreRouter from "../../core/routes/index.routes";
import GenericError from "../models/error.model";
import GenericLogger from "../utils/logger.utils";

const winstonMorgarWriter = new stream.Writable();
winstonMorgarWriter._write = function (chunk, encoding, done) {
  GenericLogger.log({
    level: "http",
    message: chunk.toString(),
  });
  done();
};

export default class Server {
  public app: express.Application;
  public port: number;

  public constructor(port: number) {
    this.port = port;
    this.app = express();
    Sentry.init({
      dsn: process.env.SENTRY_URL,
      integrations: [
        new Sentry.Integrations.Http({tracing: true}),
        new Tracing.Integrations.Express({app: this.app}),
      ],
      tracesSampleRate: 1.0,
    });

    this.config();
    this.listen();
  }

  private config(): void {
    this.app.use(bodyParser.json({limit: "50mb"}));

    this.app.use(Sentry.Handlers.requestHandler());
    this.app.use(Sentry.Handlers.tracingHandler());

    this.app.use(
      morgan("short", {
        stream: winstonMorgarWriter,
      })
    );

    this.app.use(morgan("dev"));

    this.app.get("/", (req: Request, res: Response) => {
      res.json({
        funcionando: true,
        estado: "API funcionando correctamente en el servidor",
      });
    });

    this.app.use("/v1", CoreRouter);

    this.app.use(Sentry.Handlers.errorHandler());

    this.app.use(function onError(
      err: any,
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      GenericLogger.log({
        level: "error",
        message: err.stack,
      });
      if (err instanceof GenericError) {
        res.statusCode = err.statusCode;
        res.json({
          codigoHttp: err.statusCode ? err.statusCode : 500,
          mensaje: err.publicMessage ? err.publicMessage : "Error inesperado",
          codigoInterno: err.internalCode ? err.internalCode : 0,
          error: err.message,
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
  }

  private listen(): void {
    let privateKey: Buffer | undefined;
    let certificate: Buffer | undefined;
    let intermediates: Buffer[] = [];
    try {
      if (process.env.PRIVATE_KEY_PATH && process.env.CERTIFICATE_PATH) {
        privateKey = readFileSync(process.env.PRIVATE_KEY_PATH);
        certificate = readFileSync(process.env.CERTIFICATE_PATH);
        if (process.env.INTERMEDIATE_PATH) {
          intermediates = [readFileSync(process.env.INTERMEDIATE_PATH)];
        }
      }
    } catch (error) {
      GenericLogger.log({
        level: "warn",
        message: `Error al cargar los certificados HTTPS: ${error}`,
      });
    }

    if (privateKey && certificate) {
      let httpsServer: https.Server = https.createServer(
        {
          key: privateKey,
          cert: certificate,
          ca: intermediates,
        },
        this.app
      );
      httpsServer.listen(this.port, async () => {
        GenericLogger.log({
          level: "info",
          message: `🚀 Servidor HTTPS escuchando en el puerto ${this.port}`,
        });
      });
    } else {
      let httpServer: http.Server = http.createServer(this.app);
      httpServer.listen(this.port, async () => {
        GenericLogger.log({
          level: "info",
          message: `🚀 Servidor HTTP escuchando en el puerto ${this.port}`,
        });
      });
    }
  }
}
