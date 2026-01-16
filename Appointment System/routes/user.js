import express from "express"
import * as userController from "../controller/user.js"
import { authJwt } from "../middleware/auth.js";
const router = express.Router()

router.post("/login",userController.login)
router.post("/register",userController.register)
router.get("/me", userController.getCurrentUser)
router.post("/logout", userController.logout)
router.get("/doctors", userController.getDoctorsBySpecialty);
router.get("/allDoctors", userController.getAllDoctorss);
// Admin
router.get("/", authJwt, userController.getAllUsers);


export default router