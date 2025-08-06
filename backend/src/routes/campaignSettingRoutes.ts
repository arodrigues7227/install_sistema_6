import express from "express";
import isAuth from "../middleware/isAuth";
import * as CampaignSettingController from "../controllers/CampaignSettingController";

const routes = express.Router();

routes.get("/campaign-settings", isAuth, CampaignSettingController.index);

routes.post("/campaign-settings", isAuth, CampaignSettingController.store);
// routes.put("/campaign-settings/:id", isAuth, CampaignSettingController.update);


export default routes;