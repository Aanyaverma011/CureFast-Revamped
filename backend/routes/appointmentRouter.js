import express from "express";
import { cancelAppointment, createAppointment, getAppointmentByDoctor, getAppointments, getAppointmentsByPatient, getRegisteredUserCount, getStats, updateAppointment } from '../controllers/appointmentController.js';

const appointmentRouter = express.Router();

appointmentRouter.get("/", getAppointments);
appointmentRouter.get("/stats/summary", getStats);

appointmentRouter.post(
  "/",
  createAppointment
);

appointmentRouter.get(
  "/me",
  getAppointmentsByPatient
);

appointmentRouter.get("/doctor/:doctorId", getAppointmentByDoctor);

appointmentRouter.post("/:id/cancel", cancelAppointment);
appointmentRouter.get('/patients/count', getRegisteredUserCount);
appointmentRouter.put("/:id", updateAppointment);

export default appointmentRouter;
