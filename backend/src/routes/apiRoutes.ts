import express from "express";
import isApi from "../middleware/isApi";
import multer from "multer";
import uploadConfig from "../config/upload";
import * as ApiController from "../controllers/ApiController";

const upload = multer(uploadConfig);
const apiRoutes = express.Router();
apiRoutes.post("/send", isApi, upload.array("medias"), ApiController.index);
apiRoutes.post("/send/linkImage", isApi, ApiController.indexImage);
apiRoutes.post("/checkNumber", isApi, ApiController.checkNumber);

export default apiRoutes;