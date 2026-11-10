import mongoose from 'mongoose';
import University from './models/University.js';
import CampusRegistration from './models/CampusRegistration.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uni-finder';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for seeding');

  await University.deleteMany({});
  await CampusRegistration.deleteMany({});

  const bnu = await University.create({ name: 'BNU', sector: 'Private', city: 'Lahore', status: 'approved' });
  const ucp = await University.create({ name: 'UCP', sector: 'Private', city: 'Lahore', status: 'approved' });
  const comsats = await University.create({ name: 'COMSATS Islamabad', sector: 'Public', city: 'Islamabad', status: 'approved' });
  const pendingUni = await University.create({ name: 'Lahore Orbital University', sector: 'Private', city: 'Lahore', status: 'pending' });

  const baseReg = {
    registrantUserId: 'user_demo_123',
    registrantEmail: 'jareer1234@gmail.com',
    campusType: 'Main',
    officialName: 'Test Campus',
    province: 'Punjab',
    city: 'Lahore',
    address: '123 Test St',
    registrantName: 'Jareer',
    designation: 'Director',
    phone: '+923001234567',
    declarationAccepted: true,
  };

  const regPending = await CampusRegistration.create({
    ...baseReg,
    universityId: bnu._id,
    officialName: 'BNU Main Campus',
    status: 'pending',
    history: [{ status: 'pending', note: 'Initial submission' }]
  });

  const regRejected = await CampusRegistration.create({
    ...baseReg,
    universityId: ucp._id,
    officialName: 'UCP Test Campus',
    status: 'rejected',
    rejection: {
      reason: 'Invalid documents',
      note: 'Please provide valid PDF documents.',
      decidedAt: new Date()
    },
    history: [{ status: 'rejected', note: 'Invalid documents: Please provide valid PDF documents.' }]
  });

  const regResubmission = await CampusRegistration.create({
    ...baseReg,
    universityId: comsats._id,
    officialName: 'COMSATS Lahore Campus',
    status: 'resubmission_requested',
    resubmission: {
      requiredDocs: ['HEC Campus Recognition Certificate', 'University NOC on official letterhead'],
      note: 'Need NOC from HEC',
      requestedAt: new Date()
    },
    history: [{ status: 'resubmission_requested', note: 'Need NOC from HEC' }]
  });

  const regApproved = await CampusRegistration.create({
    ...baseReg,
    universityId: bnu._id,
    city: 'Karachi',
    officialName: 'BNU Karachi Campus',
    status: 'approved',
    history: [{ status: 'approved', note: 'Approved by admin' }]
  });

  console.log('Seed complete!');
  console.log(`
To test the PATCH endpoint for flipping status:

curl -X PATCH http://localhost:5000/api/campus-registrations/${regPending._id}/status \\
  -H "Content-Type: application/json" \\
  -d '{"action":"approve","note":"Looks good"}'

curl -X PATCH http://localhost:5000/api/campus-registrations/${regPending._id}/status \\
  -H "Content-Type: application/json" \\
  -d '{"action":"reject","reason":"Invalid documents","note":"Document is blurry"}'

curl -X PATCH http://localhost:5000/api/campus-registrations/${regPending._id}/status \\
  -H "Content-Type: application/json" \\
  -d '{"action":"request_resubmission","requiredDocs":["HEC NOC"],"note":"Missing NOC"}'
  `);
  
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
