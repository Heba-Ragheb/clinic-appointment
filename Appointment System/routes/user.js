import express from "express"
import * as userController from "../controller/user.js"

const router = express.Router()

router.post("/login",userController.login)
router.post("/register",userController.register)
router.get("/me", userController.getCurrentUser)
router.post("/logout", userController.logout)

export default router