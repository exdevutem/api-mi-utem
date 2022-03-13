import { initializeApp } from "firebase-admin/app";
import MainBrowser from "./infrastructure/browser/browser";
import Server from "./infrastructure/server/server";

initializeApp();

declare global {
  interface String {
    toTitleCase(): string;
  }
}

String.prototype.toTitleCase = function (): string {
  return this.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

const server = new Server(process.env.PORT ? parseInt(process.env.PORT) : 3000);
const browser = new MainBrowser();

export { server, browser };
