import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import {  getAuth } from "@clerk/express";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const MAJOR_ADMIN_ID = process.env.MAJOR_ADMIN_ID;

//helper functions
const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function resolveClerkUserId(req) {
  try {
    const auth = req.auth || {};
    const fromReq = auth?.userId || auth?.user_id || auth?.user?.id || req.user?.id || null;
    if (fromReq) return fromReq;
    try {
      const serverAuth = getAuth ? getAuth(req) : null;
      return serverAuth?.userId || null;
    } catch (e) {
      return null;
    }
  } catch (e) {
    return null;
  }
}


//to get appointments 
export const getAppointments = async(req, res) =>{
    try{
 const { doctorId, mobile, status, search = "", limit: limitRaw = 50, page: pageRaw = 1, patientClerkId, createdBy } = req.query;
    const limit = Math.min(200, Math.max(1, parseInt(limitRaw, 10) || 50));
    const page = Math.max(1, parseInt(pageRaw, 10) || 1);
    const skip = (page - 1) * limit;

    const filter = {};
    if (doctorId) filter.doctorId = doctorId;
    if (mobile) filter.mobile = mobile;
    if (status) filter.status = status;
    if (patientClerkId) filter.createdBy = patientClerkId;
    if (createdBy) filter.createdBy = createdBy;
    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ patientName: re }, { mobile: re }, { notes: re }];
    }
const items = await Appointment.find(filter)
  .sort({ createdAt: -1 })   
  .skip(skip)                
  .limit(limit)              
  .populate("doctorId", "name specialization owner imageUrl image")
  .lean();                   


const total = await Appointment.countDocuments(filter);
return res.json({
success: true,
appointments: items,
meta: { page, limit, total, count: items.length }
});
    }
catch(err){
console.error("GetAppointments err: ", err);
return res.status(500).json({
success: false,
message: "Server error"
});
}
}

//to get appointment by patient
export const getAppointmentsByPatient = async (req, res) => {
  try {
    const queryCreatedBy = req.query.createdBy || null;

    const auth = getAuth(req);
    const clerkUserId = auth.userId || null;

    const resolvedCreatedBy =
      queryCreatedBy || clerkUserId || null;

    console.log(
      "resolvedCreatedBy:",
      resolvedCreatedBy
    );

    if (!resolvedCreatedBy && !req.query.mobile) {
      return res.status(400).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const filter = {};

    if (resolvedCreatedBy) {
      filter.createdBy = resolvedCreatedBy;
    }

    if (req.query.mobile) {
      filter.mobile = req.query.mobile;
    }

    const appointments = await Appointment.find(filter)
      .sort({ date: 1, time: 1 })
      .lean();

    return res.json({
      success: true,
      appointments,
    });

  } catch (err) {
    console.error(
      "GetAppointmentsByPatient err:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//to create an appointment
export const createAppointment = async (req, res) => {
try{
    const {
      doctorId,
      patientName,
      mobile,
      age = "",
      gender = "",
      date,
      time,
      fee,
      fees,
      notes = "",
      email,
      owner: ownerFromBody = null,
      doctorName: doctorNameFromBody,
      speciality: specialityFromBody,
      doctorImageUrl: doctorImageUrlFromBody,
      doctorImagePublicId: doctorImagePublicIdFromBody,
    } = req.body || {};

const clerkUserId = resolveClerkUserId(req);
if(!clerkUserId) return res.status(401).json({
success: false,
message: "Authentication is required."
});

if(!doctorId || !patientName || !mobile || !date || !time){
return res.status(400).json({
success: false,
message: "All fields are required."
});
}

const numericFee = safeNumber(fee ?? fees ?? 0);
if(numericFee === null || numericFee<0){
  return res.status(400).json({
success: false,
message: "Fee must be a valid number"
  });
}

const existingBooking = await Appointment.findOne({
  doctorId,
  createdBy: clerkUserId,
  date: String(date),
  time: String(time),
  status: {$ne: "Canceled"},
}).lean();

if(existingBooking){
  return res.status(409).json({
success: false,
message: "You already have an appointment with this doctor at the selected slots"
  });
}

let doctor = null;
try{
  doctor = await Doctor.findById(doctorId).lean();

}catch(e){
  console.warn("Doctor lookup failed:", e?.message || e);
}

if(!doctor) return res.status(404).json({
success: false,
message: "Doctor not found"
});

if (doctor.availability === "Unavailable") {
  return res.status(409).json({ success: false, message: "Doctor is not available for appointments." });
}

const doctorSchedule = doctor.schedule instanceof Map
  ? doctor.schedule.get(String(date))
  : doctor.schedule?.[String(date)];
if (!Array.isArray(doctorSchedule) || !doctorSchedule.includes(String(time))) {
  return res.status(409).json({ success: false, message: "The selected date or time is not available." });
}

const conflictingBooking = await Appointment.findOne({
  doctorId: doctor._id,
  date: String(date),
  time: String(time),
  status: { $nin: ["Canceled", "Cancelled"] },
}).lean();
if (conflictingBooking) {
  return res.status(409).json({ success: false, message: "The selected time slot has already been booked." });
}

 let resolvedOwner = ownerFromBody || doctor.owner || null;
    if (!resolvedOwner) resolvedOwner = MAJOR_ADMIN_ID || String(doctorId);

    const doctorName = (doctor.name && String(doctor.name).trim()) || (doctorNameFromBody && String(doctorNameFromBody).trim()) || "";
    const speciality =
      (doctor.specialization && String(doctor.specialization).trim()) ||
      (doctor.speciality && String(doctor.speciality).trim()) ||
      (specialityFromBody && String(specialityFromBody).trim()) ||
      "";

    const doctorImageUrl =
      (doctor.imageUrl && String(doctor.imageUrl).trim()) ||
      (doctor.image && String(doctor.image).trim()) ||
      (doctor.avatarUrl && String(doctor.avatarUrl).trim()) ||
      (doctor.profileImage && doctor.profileImage.url && String(doctor.profileImage.url).trim()) ||
      (doctorImageUrlFromBody && String(doctorImageUrlFromBody).trim()) ||
      "";

    const doctorImagePublicId =
      (doctor.imagePublicId && String(doctor.imagePublicId).trim()) ||
      (doctor.profileImage && doctor.profileImage.publicId && String(doctor.profileImage.publicId).trim()) ||
      (doctorImagePublicIdFromBody && String(doctorImagePublicIdFromBody).trim()) ||
      "";

    const doctorImage = { url: doctorImageUrl, publicId: doctorImagePublicId };

    const base = {
      doctorId: doctor._id ,
      doctorName,
      speciality,
      doctorImage,
      patientName: String(patientName).trim(),
      mobile: String(mobile).trim(),
      age: age ? Number(age) : undefined,
      gender: gender ? String(gender) : "",
      date: String(date),
      time: String(time),
      fees: numericFee,
      status: "Pending",
      notes: notes || "",
      createdBy: clerkUserId,
      owner: resolvedOwner,
    };

    const created = await Appointment.create(base);
    return res.status(201).json({ success: true, appointment: created });
  } catch (err) {
    console.error("createAppointment unexpected:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

//to update an appointment
export const updateAppointment = async(req, res) => {
  try{
const {id} = req.params;
const body = req.body || {};
const appt = await Appointment.findById(id);

if(!appt) return res.status(404).json({
  success: false,
  message: "Appointment not found"
});

const terminal = appt.status === "Completed" || appt.status === "Canceled";
    if (terminal && body.status && body.status !== appt.status) {
      return res.status(400).json({ success: false, message: "Cannot change status of a completed/canceled appointment" });
    }

    const update = {};
    if (body.status) update.status = body.status;
    if (body.notes !== undefined) update.notes = body.notes;

    if (body.date && body.time) {
      if (appt.status === "Completed" || appt.status === "Canceled") {
        return res.status(400).json({ success: false, message: "Cannot reschedule completed/canceled appointment" });
      }
      update.date = body.date;
      update.time = body.time;
      update.status = "Rescheduled";
      update.rescheduledTo = { date: body.date, time: body.time };
    }

    const updated = await Appointment.findByIdAndUpdate(id, update, { new: true, runValidators: true }).populate({path: "doctorId", select: "name imageUrl" }).lean();

    return res.json({ success: true, appointment: updated });

  }
  catch(err){
console.error("UpdatedAppointment error:", err);
return res.status(500).json({ success: false, message: "Server error" });
  }
}

//to cancel appointment 
export const cancelAppointment = async(req, res) => {
try{
const {id} = req.params;
const appt = await Appointment.findById(id);

if(!appt) return res.status(404).json({
  success: false,
  message: "Appointment not found"
});
appt.status = "Canceled";
await appt.save();
return res.json({ success: true, appointment: appt});

}
catch(err){
console.error("CancelAppointment error:", err);
return res.status(500).json({ success: false, message: "Server error" });
}
}

//to get stats
export const getStats = async(req, res) => {
  try{
const total = await Appointment.countDocuments();

const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate()-7);
const recent = await Appointment.countDocuments({ createdAt: {$gte: sevenDaysAgo}});

return res.json({
  success: true,
  stats: { total, recentLast7Days: recent }
});
  }
  catch(err){
console.error("getStats error:", err);
return res.status(500).json({ success: false, message: "Server error" });
  }
}

//to getAppointment by doctor
export const getAppointmentByDoctor = async(req, res) => {
try{
const {doctorId} = req.params;
if(!doctorId) return res.status(400).json({
success: false,
message: "Doctor Id required"
});

const { mobile, status, search = "", limit: limitRaw = 50, page: pageRaw = 1 } = req.query;
    const limit = Math.min(200, Math.max(1, parseInt(limitRaw, 10) || 50));
    const page = Math.max(1, parseInt(pageRaw, 10) || 1);
    const skip = (page - 1) * limit;

    const filter = { doctorId };
    if (mobile) filter.mobile = mobile;
    if (status) filter.status = status;
    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ patientName: re }, { mobile: re }, { notes: re }];
    }

const items = await Appointment.find(filter).sort({ date: 1, time: 1}).skip(skip).limit(limit)
.populate("doctorId", "name specialization owner imageUrl image").lean();

const total = await Appointment.countDocuments(filter);
return res.json({
  success: true,
  appointments: items,
  meta: { page, limit, total, count: items.length }
});

}
catch(err){
console.error("getAppointmentByDoctor error:", err);
return res.status(500).json({ success: false, message: "Server error" });
}
}

//to get register user count
export async function getRegisteredUserCount(req, res) {
  try {
    let totalUsers = 0;
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await clerkClient.users.getUserList({
        limit,
        offset,
      });

      const users = response.data;

      totalUsers += users.length;

      if (users.length < limit) break;

      offset += limit;
    }

    return res.json({
      success: true,
      count: totalUsers,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export default{
getAppointments,
getAppointmentsByPatient,
createAppointment,
updateAppointment,
cancelAppointment,
getStats,
getAppointmentByDoctor,
getRegisteredUserCount,
}