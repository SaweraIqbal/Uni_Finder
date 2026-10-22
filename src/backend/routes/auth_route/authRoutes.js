import express from "express";
import { signup, login } from "../../controllers/auth_controller/authController.js";
import { getUserById,getStudentProfile,Student_Profile,updateStudentProfile } from "../../controllers/auth_controller/profilecontroll.js";
const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.get("/user/:id", getUserById);
router.post("/Student_profile",Student_Profile);
router.get("/student_profile/:id", getStudentProfile);
router.put("/Student_profile/update", updateStudentProfile);

export default router;