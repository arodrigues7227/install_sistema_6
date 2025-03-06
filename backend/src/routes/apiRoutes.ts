import express from "express";
import multer from "multer";
import uploadConfig from "../config/upload";

import * as ApiController from "../controllers/ApiController";
import tokenAuth from "../middleware/tokenAuth";

const upload = multer(uploadConfig);

const ApiRoutes = express.Router();

ApiRoutes.post("/send", tokenAuth, upload.array("medias"), ApiController.index);
ApiRoutes.post("/send/linkImage", tokenAuth, ApiController.indexImage);
ApiRoutes.post("/checkNumber", tokenAuth, ApiController.checkNumber)

export default ApiRoutes;
