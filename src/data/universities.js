export function toRad(deg) {
  return deg * (Math.PI / 180);
}

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const UNIVERSITY_PROFILE = {
  ucp: {
    hec_rank: 34,
    sector: "private",
    students: "15,000",
    phd_faculty: "150",
    employment_rate: "94%",
    established_year: "2002",
    about_text:
      "The University of Central Punjab is a premier institution dedicated to academic excellence and holistic student development. We foster an environment of innovation, critical thinking, and ethical leadership, preparing our graduates to meet global challenges head-on.",
    description:
      "Our world-class faculty and state-of-the-art facilities provide an unparalleled learning environment that bridges theory with real-world application, empowering students to lead in their respective fields.",
    mission:
      "To provide quality education, fostering research, innovation, and ethical values, enabling students to become responsible global citizens and leaders in their respective fields.",
    banner_url:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1800&auto=format&fit=crop&q=80",
  },
  lums: {
    hec_rank: 3,
    sector: "private",
    students: "5,000",
    phd_faculty: "280",
    employment_rate: "96%",
    established_year: "1985",
    banner_url:
      "https://images.unsplash.com/photo-1562774053-701939374585?w=1800&auto=format&fit=crop&q=80",
  },
  nust: {
    hec_rank: 2,
    sector: "government",
    students: "15,000",
    phd_faculty: "420",
    employment_rate: "92%",
    established_year: "1991",
    banner_url:
      "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1800&auto=format&fit=crop&q=80",
  },
  iba: {
    hec_rank: 8,
    sector: "government",
    students: "4,200",
    phd_faculty: "160",
    employment_rate: "93%",
    established_year: "1955",
  },
  fast: {
    hec_rank: 12,
    sector: "private",
    students: "11,000",
    phd_faculty: "190",
    employment_rate: "90%",
    established_year: "2000",
  },
  uet: {
    hec_rank: 15,
    sector: "government",
    students: "14,000",
    phd_faculty: "310",
    employment_rate: "88%",
    established_year: "1921",
  },
  pucit: {
    hec_rank: 28,
    sector: "government",
    students: "6,500",
    phd_faculty: "95",
    employment_rate: "86%",
    established_year: "2000",
  },
  qau: {
    hec_rank: 6,
    sector: "government",
    students: "13,000",
    phd_faculty: "350",
    employment_rate: "85%",
    established_year: "1967",
  },
  kinnaird: {
    hec_rank: 22,
    sector: "semi-government",
    students: "4,800",
    phd_faculty: "110",
    employment_rate: "89%",
    established_year: "1913",
  },
};

export const universities = [
  {
    id: "ucp",
    name: "University of Central Punjab",
    shortName: "UCP",
    city: "Lahore",
    lat: 31.4469,
    lng: 74.2682,
    logoColor: "from-orange-500 to-amber-600",
    logoInitials: "UC",
    rating: 4.4,
    reviewsCount: 890,
    tuitionPerSemester: 110000,
    admissionFee: 15000,
    scholarship: true,
    minAggregate: 60,
    requiredTest: "UCP Entry Test / SAT",
    eligiblePrograms: "All majors",
    hostel: true,
    hostelCount: 4,
    transport: true,
    topPrograms: ["CS", "Business", "Pharmacy", "Law", "Psychology"],
    hec_rank: 34,
    sector: "private",
    students: "15,000",
    phd_faculty: "150",
    employment_rate: "94%",
    established_year: "2002",
    about_text:
      "The University of Central Punjab is a premier institution dedicated to academic excellence and holistic student development. We foster an environment of innovation, critical thinking, and ethical leadership, preparing our graduates to meet global challenges head-on.",
    description:
      "Our world-class faculty and state-of-the-art facilities provide an unparalleled learning environment that bridges theory with real-world application, empowering students to lead in their respective fields.",
    mission:
      "To provide quality education, fostering research, innovation, and ethical values, enabling students to become responsible global citizens and leaders in their respective fields.",
    banner_url:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1800&auto=format&fit=crop&q=80",
  },
  {
    id: "lums",
    name: "Lahore University of Management Sciences",
    shortName: "LUMS",
    city: "Lahore",
    lat: 31.4108,
    lng: 74.2302,
    logoColor: "from-orange-500 to-amber-500",
    logoInitials: "LU",
    rating: 4.7,
    reviewsCount: 1240,
    tuitionPerSemester: 285000,
    admissionFee: 35000,
    scholarship: true,
    minAggregate: 85,
    requiredTest: "SAT / LUMS Test",
    eligiblePrograms: "All majors",
    hostel: true,
    hostelCount: 6,
    transport: true,
    topPrograms: ["Business", "CS", "Economics", "Law", "Political Science"],
  },
  {
    id: "nust",
    name: "National University of Sciences & Technology",
    shortName: "NUST",
    city: "Islamabad",
    lat: 33.6425,
    lng: 73.0961,
    logoColor: "from-sky-500 to-blue-600",
    logoInitials: "NU",
    rating: 4.6,
    reviewsCount: 1890,
    tuitionPerSemester: 195000,
    admissionFee: 25000,
    scholarship: true,
    minAggregate: 80,
    requiredTest: "NUST Entry Test / NET",
    eligiblePrograms: "Engineering, Computing, Business",
    hostel: true,
    hostelCount: 9,
    transport: true,
    topPrograms: ["Engineering", "CS", "Architecture", "Business", "Aviation"],
  },
  {
    id: "iba",
    name: "Institute of Business Administration",
    shortName: "IBA Karachi",
    city: "Karachi",
    lat: 24.8607,
    lng: 67.0011,
    logoColor: "from-emerald-500 to-teal-600",
    logoInitials: "IB",
    rating: 4.5,
    reviewsCount: 980,
    tuitionPerSemester: 165000,
    admissionFee: 20000,
    scholarship: true,
    minAggregate: 78,
    requiredTest: "IBA Entry Test / SAT",
    eligiblePrograms: "Business, Economics, CS",
    hostel: false,
    hostelCount: 0,
    transport: true,
    topPrograms: ["Business", "Economics", "CS", "Social Sciences", "Math"],
  },
  {
    id: "fast",
    name: "FAST National University",
    shortName: "FAST-NUCES",
    city: "Karachi",
    lat: 24.914,
    lng: 67.086,
    logoColor: "from-violet-500 to-fuchsia-600",
    logoInitials: "FA",
    rating: 4.3,
    reviewsCount: 1520,
    tuitionPerSemester: 145000,
    admissionFee: 18000,
    scholarship: true,
    minAggregate: 75,
    requiredTest: "FAST Entry Test / NAT",
    eligiblePrograms: "Computing, Business",
    hostel: true,
    hostelCount: 3,
    transport: false,
    topPrograms: ["CS", "AI", "Cybersecurity", "Business", "Data Science"],
  },
  {
    id: "uet",
    name: "University of Engineering & Technology",
    shortName: "UET Lahore",
    city: "Lahore",
    lat: 31.5748,
    lng: 74.3537,
    logoColor: "from-red-500 to-orange-600",
    logoInitials: "UE",
    rating: 4.2,
    reviewsCount: 2100,
    tuitionPerSemester: 45000,
    admissionFee: 12000,
    scholarship: true,
    minAggregate: 73,
    requiredTest: "ECAT",
    eligiblePrograms: "Engineering, Architecture",
    hostel: true,
    hostelCount: 7,
    transport: true,
    topPrograms: ["Mechanical", "Electrical", "Civil", "Architecture", "CS"],
  },
  {
    id: "pucit",
    name: "Punjab University College of IT",
    shortName: "PUCIT",
    city: "Lahore",
    lat: 31.5648,
    lng: 74.31,
    logoColor: "from-amber-500 to-yellow-600",
    logoInitials: "PU",
    rating: 4.0,
    reviewsCount: 760,
    tuitionPerSemester: 38000,
    admissionFee: 8000,
    scholarship: false,
    minAggregate: 70,
    requiredTest: "PUCIT Entry Test",
    eligiblePrograms: "Computing",
    hostel: true,
    hostelCount: 2,
    transport: false,
    topPrograms: ["CS", "Software Eng", "Data Science", "IT", "AI"],
  },
  {
    id: "qau",
    name: "Quaid-i-Azam University",
    shortName: "QAU",
    city: "Islamabad",
    lat: 33.7468,
    lng: 73.137,
    logoColor: "from-green-500 to-emerald-600",
    logoInitials: "QA",
    rating: 4.4,
    reviewsCount: 1340,
    tuitionPerSemester: 32000,
    admissionFee: 10000,
    scholarship: true,
    minAggregate: 76,
    requiredTest: "Merit-based (HSSC)",
    eligiblePrograms: "Sciences, Arts, Law",
    hostel: true,
    hostelCount: 8,
    transport: true,
    topPrograms: ["Physics", "Chemistry", "Biology", "Law", "Economics"],
  },
  {
    id: "kinnaird",
    name: "Kinnaird College for Women",
    shortName: "Kinnaird",
    city: "Lahore",
    lat: 31.5497,
    lng: 74.3436,
    logoColor: "from-pink-500 to-rose-600",
    logoInitials: "KC",
    rating: 4.3,
    reviewsCount: 620,
    tuitionPerSemester: 95000,
    admissionFee: 15000,
    scholarship: true,
    minAggregate: 72,
    requiredTest: "Merit-based (HSSC)",
    eligiblePrograms: "Arts, Sciences, Business",
    hostel: true,
    hostelCount: 2,
    transport: true,
    topPrograms: ["English", "Psychology", "Business", "Bio", "Media Studies"],
  },
];

export function findUniversity(id) {
  const base =
    universities.find((u) => String(u.id) === String(id)) ||
    universities.find((u) => u.id === "ucp") ||
    universities[0];
  return { ...UNIVERSITY_PROFILE[base.id], ...base };
}

export function formatPKR(amount) {
  if (amount >= 100000) {
    return `PKR ${(amount / 1000).toFixed(0)}k`;
  }
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export function formatDistance(km) {
  if (km === 0 || km == null) return "—";
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${km.toFixed(0)} km`;
}

export function getDistanceFromHome(home, uni) {
  if (!home) return null;
  return haversineDistance(home.lat, home.lng, uni.lat, uni.lng);
}
