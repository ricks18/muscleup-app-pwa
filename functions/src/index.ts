/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from "firebase-functions";
import * as path from "path";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
  conf: { distDir: ".next" },
  dir: path.join(__dirname, ".."),
});
const handle = app.getRequestHandler();

export const nextServer = functions.https.onRequest(async (req, res) => {
  await app.prepare();
  return handle(req, res);
});
