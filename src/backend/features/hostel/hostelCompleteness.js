const parseObject = (value) => {
  if (value == null) return null;
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const parseArray = (value) => {
  const parsed = parseObject(value);
  return Array.isArray(parsed) ? parsed : [];
};

const filled = (value) =>
  typeof value === "string" ? value.trim().length > 0 : value != null;

const namedItems = (items) =>
  (Array.isArray(items) ? items : []).filter(
    (item) => item && filled(item.name)
  );

export const DISPLAY_STATUS = {
  LIVE: "live",
  PENDING_APPROVAL: "pending_approval",
  PENDING_DETAILS: "pending_details",
  REJECTED: "rejected",
};

export function evaluateHostelCompletion(
  hostel = {},
  { rooms = [], photos = [], listing = null } = {}
) {
  const fees = parseObject(listing?.additional_fees) || {};
  const amenities = parseObject(listing?.amenities) || {};
  const messDetails = parseObject(listing?.mess_details) || {};
  const security = parseObject(fees.security) || {};
  const mess = parseObject(messDetails.mess) || {};
  const inRoom = parseObject(amenities.inRoom) || {};
  const facilities = parseArray(amenities.facilities);
  const menu = parseObject(mess.menuManual) || {};
  const policies = parseArray(listing?.hostel_rules);

  const isCampusHostel = hostel.hostel_type === "university";

  const hasMessAnswer =
    typeof mess.available === "boolean" &&
    (mess.available === false ||
      filled(mess.charges) ||
      filled(mess.menuPhoto) ||
      Object.values(menu).some(filled));

  const hasAmenities =
    namedItems(inRoom.items).length > 0 || namedItems(facilities).length > 0;

  const hasSecurity =
    filled(security.fee) &&
    Array.isArray(security.types) &&
    security.types.length > 0;

  const hasPolicies = policies.some(
    (policy) => policy && (filled(policy.text) || filled(policy.category))
  );

  const profileChecks = [
    {
      key: "name",
      label: "Hostel name",
      nav: "profile",
      done: filled(hostel.name),
    },
    {
      key: "about",
      label: "About this hostel",
      nav: "profile",
      done: filled(listing?.description),
    },
    {
      key: "gender",
      label: "Hostel gender type",
      nav: "profile",
      done: filled(listing?.gender),
    },
    {
      key: "address",
      label: "Full address",
      nav: "profile",
      done: filled(hostel.address),
    },
    {
      key: "nearby_distance",
      label: "Nearby campus distance",
      nav: "profile",
      done: filled(hostel.nearby_distance),
    },
    {
      key: "location",
      label: "Map pin location",
      nav: "profile",
      done: hostel.lat != null && hostel.lng != null,
    },
    {
      key: "floors",
      label: "Total floors",
      nav: "profile",
      done: Number(hostel.floors) >= 1,
    },
    {
      key: "owner",
      label: "Owner name and contact",
      nav: "profile",
      done: filled(hostel.owner_name) && filled(hostel.owner_contact),
    },
    {
      key: "warden",
      label: "Warden name and contact",
      nav: "profile",
      done: filled(hostel.warden_name) && filled(hostel.warden_contact),
    },
    ...(isCampusHostel
      ? [
          {
            key: "campus",
            label: "Affiliated campus",
            nav: "profile",
            done: filled(hostel.campus_id),
          },
        ]
      : []),
  ];

  const listingChecks = [
    {
      key: "rooms",
      label: "Room inventory with monthly rent",
      nav: "listing",
      done: rooms.length > 0 && rooms.some((room) => Number(room.monthly_rent) > 0),
    },
    {
      key: "photos",
      label: "At least one hostel photo",
      nav: "listing",
      done: photos.length > 0,
    },
    {
      key: "security",
      label: "Security fee and type",
      nav: "listing",
      done: hasSecurity,
    },
    {
      key: "mess",
      label: "Mess / food details",
      nav: "listing",
      done: hasMessAnswer,
    },
    {
      key: "amenities",
      label: "Amenities or facilities",
      nav: "listing",
      done: hasAmenities,
    },
    {
      key: "policies",
      label: "Policies and rules",
      nav: "listing",
      done: hasPolicies,
    },
    {
      key: "inquiry",
      label: "Inquiry contact number",
      nav: "listing",
      done: filled(fees.inquiry),
    },
  ];

  const allChecks = [...profileChecks, ...listingChecks];
  const doneCount = allChecks.filter((check) => check.done).length;
  const isComplete = doneCount === allChecks.length;

  const profileDone = profileChecks.filter((check) => check.done).length;
  const listingDone = listingChecks.filter((check) => check.done).length;
  const totalRooms = rooms.reduce(
    (sum, room) => sum + Number(room.total_rooms || 0),
    0
  );
  const totalSeats = rooms.reduce(
    (sum, room) =>
      sum +
      Number(room.total_rooms || 0) * Number(room.beds_per_room || 0),
    0
  );
  const seatsAvailable = rooms.reduce(
    (sum, room) => sum + Number(room.available_beds || 0),
    0
  );
  const rents = rooms
    .map((room) => Number(room.monthly_rent))
    .filter((rent) => Number.isFinite(rent));

  let displayStatus = DISPLAY_STATUS.PENDING_APPROVAL;
  if (hostel.status === "rejected") {
    displayStatus = DISPLAY_STATUS.REJECTED;
  } else if (hostel.status === "approved") {
    displayStatus = isComplete
      ? DISPLAY_STATUS.LIVE
      : DISPLAY_STATUS.PENDING_DETAILS;
  }

  return {
    approvalStatus: hostel.status || "pending_admin",
    displayStatus,
    isLive: displayStatus === DISPLAY_STATUS.LIVE,
    isComplete,
    completeness: Math.round((doneCount / allChecks.length) * 100),
    profileCompleteness: Math.round((profileDone / profileChecks.length) * 100),
    listingCompleteness: Math.round(
      (listingDone / listingChecks.length) * 100
    ),
    profileChecks,
    listingChecks,
    missing: allChecks.filter((check) => !check.done),
    counts: {
      roomsCount: totalRooms,
      roomTypes: rooms.length,
      totalSeats,
      seatsAvailable,
      photosCount: photos.length,
      rentMin: rents.length ? Math.min(...rents) : null,
      rentMax: rents.length ? Math.max(...rents) : null,
    },
  };
}

export function listingAmenityNames(listing) {
  const amenities = parseObject(listing?.amenities) || {};
  const inRoom = parseObject(amenities.inRoom) || {};
  const names = [
    ...namedItems(inRoom.items).map((item) => String(item.name).trim()),
    ...namedItems(parseArray(amenities.facilities)).map((item) =>
      String(item.name).trim()
    ),
  ];
  return [...new Set(names)].filter(Boolean).slice(0, 4);
}
