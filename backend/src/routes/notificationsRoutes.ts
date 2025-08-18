import express from "express";
import isAuth from "../middleware/isAuth";
import * as NotificationsController from "../controllers/NotificationsController";

const notificationsRoutes = express.Router();

// Rota para enviar notificações
notificationsRoutes.post("/notifications", isAuth, NotificationsController.notifyAll);

// Rotas para gerenciar subscriptions
notificationsRoutes.post("/subscribe", isAuth, NotificationsController.store);
notificationsRoutes.get("/subscribe", isAuth, NotificationsController.show);
notificationsRoutes.delete("/subscribe/:userId", isAuth, NotificationsController.remove);

// Nova rota para teste de notificação
notificationsRoutes.post("/notifications/test", isAuth, NotificationsController.test);

export default notificationsRoutes;