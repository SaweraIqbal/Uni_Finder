import mongoose from 'mongoose';

const universitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  sector: { type: String, enum: ['Public', 'Private'], required: true },
  city: { type: String, required: true },
  province: { type: String },
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  emailDomain: { type: String },
}, { timestamps: true });

export default mongoose.model('University', universitySchema);
