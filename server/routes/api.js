import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import asyncHandler from 'express-async-handler';
import University from '../models/University.js';
import CampusRegistration from '../models/CampusRegistration.js';
import { authMock } from '../middleware/auth-mock.js';

const router = express.Router();

// Ensure uploads dir exists
const uploadDir = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// GET /api/universities/approved
router.get('/universities/approved', asyncHandler(async (req, res) => {
  const universities = await University.find({ status: 'approved' }).sort('name');
  res.json(universities.map(u => ({ id: u._id, name: u.name, sector: u.sector, city: u.city })));
}));

const validateRegistration = (req, res, next) => {
  const errors = {};
  const { campusType, officialName, province, city, registrantName, designation, phone, officialEmail, declarationAccepted } = req.body;
  
  if (!['Main', 'Sub', 'Regional', 'City'].includes(campusType)) errors.campusType = 'Invalid campus type';
  if (!officialName || officialName.length < 3) errors.officialName = 'Must be at least 3 characters';
  if (!province) errors.province = 'Province is required';
  if (!city) errors.city = 'City is required';
  if (!registrantName || registrantName.length < 3) errors.registrantName = 'Must be at least 3 characters';
  if (!designation) errors.designation = 'Designation is required';
  
  const phoneRegex = /^03\d{9}$/;
  const phoneRegex2 = /^\+923\d{9}$/;
  let cleanPhone = phone?.replace(/[\s-]/g, '');
  if (cleanPhone && (phoneRegex.test(cleanPhone) || phoneRegex2.test(cleanPhone))) {
    if (cleanPhone.startsWith('03')) {
      req.body.phone = '+92' + cleanPhone.slice(1);
    } else {
      req.body.phone = cleanPhone;
    }
  } else {
    errors.phone = 'Enter a valid number: 03XXXXXXXXX or +92 3XX XXXXXXX';
  }
  
  if (officialEmail && !/^\S+@\S+\.\S+$/.test(officialEmail)) errors.officialEmail = 'Invalid email format';
  if (declarationAccepted !== 'true' && declarationAccepted !== true) errors.declarationAccepted = 'Declaration must be accepted';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }
  next();
};

// POST /api/campus-registrations
router.post('/campus-registrations', authMock, (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      if (err.message === 'Only PDF files are allowed' || err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ errors: { document: err.message === 'Only PDF files are allowed' ? 'Only PDF files are allowed' : 'File must be under 10MB' } });
      }
      return res.status(400).json({ errors: { document: err.message } });
    }
    next();
  });
}, validateRegistration, asyncHandler(async (req, res) => {
  const { universityId, campusType, officialName, province, city, address, registrantName, designation, phone, officialEmail, declarationAccepted } = req.body;
  
  const university = await University.findById(universityId);
  if (!university || university.status !== 'approved') {
    return res.status(400).json({ errors: { universityId: 'Invalid or unapproved university' } });
  }

  const existing = await CampusRegistration.findOne({
    universityId,
    city,
    status: { $in: ['pending', 'approved', 'resubmission_requested'] }
  });
  
  if (existing) {
    return res.status(409).json({ message: 'A registration for this university in this city already exists.' });
  }

  let docData = null;
  if (req.file) {
    docData = {
      originalName: req.file.originalname,
      storedPath: req.file.path,
      size: req.file.size
    };
  }

  const reg = new CampusRegistration({
    registrantUserId: req.user.id,
    registrantEmail: req.user.email,
    universityId,
    campusType,
    officialName,
    province,
    city,
    address,
    registrantName,
    designation,
    phone: req.body.phone,
    officialEmail,
    document: docData,
    declarationAccepted: true,
    status: 'pending',
    history: [{ status: 'pending', note: 'Initial submission' }]
  });

  await reg.save();
  res.status(201).json({ data: { publicId: reg.publicId } });
}));

// GET /api/campus-registrations/mine
router.get('/campus-registrations/mine', authMock, asyncHandler(async (req, res) => {
  const reg = await CampusRegistration.findOne({ registrantUserId: req.user.id }).sort('-createdAt').populate('universityId');
  if (!reg) {
    return res.status(404).json({ data: null });
  }
  res.json({ data: reg });
}));

// POST /api/campus-registrations/:id/resubmit
router.post('/campus-registrations/:id/resubmit', authMock, (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      if (err.message === 'Only PDF files are allowed' || err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ errors: { document: err.message === 'Only PDF files are allowed' ? 'Only PDF files are allowed' : 'File must be under 10MB' } });
      }
      return res.status(400).json({ errors: { document: err.message } });
    }
    next();
  });
}, validateRegistration, asyncHandler(async (req, res) => {
  const reg = await CampusRegistration.findOne({ _id: req.params.id, registrantUserId: req.user.id });
  if (!reg) return res.status(404).json({ message: 'Not found' });
  
  if (!['rejected', 'resubmission_requested'].includes(reg.status)) {
    return res.status(400).json({ message: 'Cannot resubmit in current status' });
  }

  const { campusType, officialName, province, city, address, registrantName, designation, phone, officialEmail } = req.body;
  
  reg.campusType = campusType;
  reg.officialName = officialName;
  reg.province = province;
  reg.city = city;
  reg.address = address;
  reg.registrantName = registrantName;
  reg.designation = designation;
  reg.phone = req.body.phone;
  reg.officialEmail = officialEmail;
  
  if (req.file) {
    reg.document = {
      originalName: req.file.originalname,
      storedPath: req.file.path,
      size: req.file.size
    };
  }

  reg.status = 'pending';
  reg.rejection = undefined;
  reg.history.push({ status: 'pending', note: 'Resubmitted' });
  
  await reg.save();
  res.json({ data: { publicId: reg.publicId } });
}));

// PATCH /api/campus-registrations/:id/status
router.patch('/campus-registrations/:id/status', asyncHandler(async (req, res) => {
  // TODO: role guard for reviewer
  const { action, reason, note, requiredDocs } = req.body;
  const reg = await CampusRegistration.findById(req.params.id);
  if (!reg) return res.status(404).json({ message: 'Not found' });

  if (action === 'reject') {
    if (!reason) return res.status(400).json({ errors: { reason: 'Reason is required' } });
    reg.status = 'rejected';
    reg.rejection = { reason, note, decidedAt: new Date() };
    reg.history.push({ status: 'rejected', note: reason + (note ? `: ${note}` : '') });
  } else if (action === 'request_resubmission') {
    if (!requiredDocs || !Array.isArray(requiredDocs) || requiredDocs.length === 0) {
      return res.status(400).json({ errors: { requiredDocs: 'requiredDocs array is required' } });
    }
    reg.status = 'resubmission_requested';
    reg.resubmission = { requiredDocs, note, requestedAt: new Date() };
    reg.history.push({ status: 'resubmission_requested', note });
  } else if (action === 'approve') {
    reg.status = 'approved';
    reg.history.push({ status: 'approved', note });
  } else {
    return res.status(400).json({ message: 'Invalid action' });
  }

  await reg.save();
  res.json({ data: reg });
}));

export default router;
