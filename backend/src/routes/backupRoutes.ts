import express from "express";
import isAuth from "../middleware/isAuth";
import isSuper from "../middleware/isSuper";
import BackupController from "../controllers/BackupController";

const routes = express.Router();

routes.get('/api/backup', isAuth, isSuper, BackupController.backup);

export default routes;