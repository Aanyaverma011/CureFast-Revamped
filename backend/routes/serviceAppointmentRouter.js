import express from "express";

import { cancelServiceAppointment, createServiceAppointment, getServiceAppointmentById, getServiceAppointments, getServiceAppointmentsByPatient, getServiceAppointmentStats, updateServiceAppointment, } from '../controllers/serviceAppointmentController.js';

const serviceAppointmentRouter = express.Router();

serviceAppointmentRouter.get("/", getServiceAppointments);
serviceAppointmentRouter.get("/stats/summary", getServiceAppointmentStats);

serviceAppointmentRouter.post("/", createServiceAppointment);

serviceAppointmentRouter.get("/me", getServiceAppointmentsByPatient);

serviceAppointmentRouter.get("/:id", getServiceAppointmentById);
serviceAppointmentRouter.put("/:id", updateServiceAppointment);
serviceAppointmentRouter.post("/:id/cancel", cancelServiceAppointment);

export default serviceAppointmentRouter;