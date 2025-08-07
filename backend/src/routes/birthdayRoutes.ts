// src/routes/birthdayRoutes.ts
import express from "express";
import isAuth from "../middleware/isAuth";
import * as BirthdayController from "../controllers/BirthdayController";

const routes = express.Router();

// Buscar aniversariantes do dia
routes.get("/birthdays/today", isAuth, BirthdayController.getTodayBirthdays);

// Configurações de aniversário
routes.get("/birthdays/settings", isAuth, BirthdayController.getBirthdaySettings);
routes.put("/birthdays/settings", isAuth, BirthdayController.updateBirthdaySettings);

// Enviar mensagem de aniversário manualmente
routes.post("/birthdays/send-message", isAuth, BirthdayController.sendBirthdayMessage);

// Testar mensagem de aniversário
routes.post("/birthdays/test-message", isAuth, BirthdayController.testBirthdayMessage);

// Processar aniversários manualmente (admin only)
routes.post("/birthdays/process", isAuth, BirthdayController.processTodayBirthdays);

export default routes;