import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as ChatbotController from "../controllers/ChatbotController";

const routes = Router();

routes.get("/chatbot", isAuth, ChatbotController.index);

routes.post("/chatbot", isAuth, ChatbotController.store);

routes.get("/chatbot/:chatbotId", isAuth, ChatbotController.show);

routes.put("/chatbot/:chatbotId", isAuth, ChatbotController.update);

routes.delete("/chatbot/:chatbotId", isAuth, ChatbotController.remove);

export default routes;
