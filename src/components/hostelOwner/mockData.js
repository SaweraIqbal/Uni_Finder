// Temporary data - replace with API response later
export const mockOwner = {
  name: 'Ahsan Malik',
  hostelName: 'Campus View Hostel',
};

export const mockOverview = {
  // 'draft' | 'under_review' | 'approved' | 'rejected'
  status: 'under_review',
  roomsListed: 24,
  roomTypes: 4,
  seatsAvailable: 67,
  totalSeats: 92,
  completeness: 75,
  setup: [
    { id: 'profile', label: 'Hostel profile details', done: true, nav: 'profile' },
    { id: 'rooms', label: 'Room inventory and pricing', done: true, nav: 'listing' },
    { id: 'certificate', label: 'Upload safety certificate', done: false, nav: 'profile' },
  ],
};

export const mockProfile = {
  // 'not_submitted' | 'submitted' | 'approved' | 'rejected'
  verification: 'not_submitted',
  name: 'Campus View Hostel',
  about: '',
  gender: 'boys', // 'boys' | 'girls'
  ownership: 'private', // 'private' | 'campus'
  campusId: '', // required when ownership is 'campus'
  address: 'Street 12, Sector H-13, Islamabad',
  nearbyDistance: '',
  gps: '33.6481° N, 72.9629° E',
  floors: '4',
  owner: { name: 'Ahsan Malik', contact: '300 1234567' },
  warden: { name: 'Kamran Ali', contact: '312 7654321' },
};

// Temporary list - replace with campuses from the API later
export const mockCampuses = [
  { id: 'c1', name: 'NUST H-12 Campus, Islamabad' },
  { id: 'c2', name: 'COMSATS Islamabad Campus' },
  { id: 'c3', name: 'UCP Lahore Campus' },
  { id: 'c4', name: 'FAST-NUCES Lahore Campus' },
];