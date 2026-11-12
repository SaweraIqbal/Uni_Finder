export const mockOwner = {
  name: 'Ahsan Malik',
  hostelName: 'Campus View Hostel',
};

export const mockOverview = {

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

  verification: 'not_submitted',
  name: 'Campus View Hostel',
  about: '',
  gender: 'boys',
  ownership: 'private',
  campusId: '',
  address: 'Street 12, Sector H-13, Islamabad',
  nearbyDistance: '',
  gps: '33.6481° N, 72.9629° E',
  floors: '4',
  owner: { name: 'Ahsan Malik', contact: '300 1234567' },
  warden: { name: 'Kamran Ali', contact: '312 7654321' },
};

export const mockCampuses = [
  { id: 'c1', name: 'NUST H-12 Campus, Islamabad' },
  { id: 'c2', name: 'COMSATS Islamabad Campus' },
  { id: 'c4', name: 'FAST-NUCES Lahore Campus' },
];