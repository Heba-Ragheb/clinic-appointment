import express from "express";
import {
	index,
	show,
	store,
	update,
	deleteAppointDoctor,
	deleteAppointUser,
} from "../controller/appointmentController.js";
import { authJwt } from "../middleware/auth.js";
import cacheForUser from "../middleware/cacheForUser.js";



const router = express.Router();

router.get("/", authJwt, index);
router.get("/:id", authJwt, cacheForUser(600), show);
router.post("/doctor/:id", authJwt, store);
router.patch("/:id", authJwt, update);
router.delete("/user/:id", authJwt, deleteAppointUser);
router.delete("/doctor/:id", authJwt, deleteAppointDoctor);

export default router;
