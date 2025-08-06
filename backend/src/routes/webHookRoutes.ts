import express from "express";
import * as WebHooksController from "../controllers/WebHookController";
const webHooksRoutes = express.Router();
webHooksRoutes.get("/", WebHooksController.index);
webHooksRoutes.post("/", WebHooksController.webHook);
export default webHooksRoutes;
//