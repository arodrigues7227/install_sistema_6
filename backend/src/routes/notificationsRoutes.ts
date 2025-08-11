import express from "express";
import isAuth from "../middleware/isAuth";
import * as NotificationsController from "../controllers/NotificationsController";


const notificationsRoutes = express.Router();

notificationsRoutes.post("/notifications", isAuth, NotificationsController.notifyAll);
notificationsRoutes.post("/subscribe", isAuth, NotificationsController.store);
notificationsRoutes.get("/subscribe", isAuth, NotificationsController.show);
notificationsRoutes.delete("/subscribe/:userId", isAuth, NotificationsController.remove);

export default notificationsRoutes;