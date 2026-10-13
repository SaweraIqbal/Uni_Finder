import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

const campusRegistrationSchema = new mongoose.Schema({
  publicId: { type: String, unique: true },
  registrantUserId: { type: String, required: true },
  registrantEmail: { type: String, required: true },
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
  campusType: { type: String, enum: ['Main', 'Sub', 'Regional', 'City'], required: true },
  officialName: { type: String, required: true, minlength: 3 },
  province: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null }, // reserved for future map feature
  registrantName: { type: String, required: true, minlength: 3 },
  designation: { type: String, required: true },
  phone: { type: String, required: true },
  officialEmail: { type: String },
  document: {
    originalName: String,
    storedPath: String,
    size: Number,
  },
  declarationAccepted: { type: Boolean, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'resubmission_requested'], default: 'pending' },
  rejection: {
    reason: { type: String, enum: ['Not an official campus', 'Invalid documents', 'Duplicate registration', 'Other'] },
    note: String,
    decidedAt: Date,
  },
  resubmission: {
    requiredDocs: [String],
    note: String,
    requestedAt: Date,
  },
  history: [{
    status: String,
    at: { type: Date, default: Date.now },
    note: String,
  }],
}, { timestamps: true });

campusRegistrationSchema.pre('save', function(next) {
  if (!this.publicId) {
    this.publicId = `CMP-${nanoid()}`;
  }
  next();
});

export default mongoose.model('CampusRegistration', campusRegistrationSchema);
