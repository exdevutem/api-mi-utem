import * as firebaseAdmin from "firebase-admin";
import MainBrowser from "./infrastructure/browser/browser";
import Server from "./infrastructure/server/server";

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert({
    projectId: process.env.FIREBASE_ADMINSDK_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMINSDK_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMINSDK_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    ),
  }),
});

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
let browser: MainBrowser;
if (process.env.DEACTIVATE_BROWSER != "true") {
  browser = new MainBrowser();
}

export { server, browser };
