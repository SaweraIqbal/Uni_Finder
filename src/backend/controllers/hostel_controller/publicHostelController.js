import db from "../../config/db.js";
import {
  evaluateHostelCompletion,
  listingAmenityNames,
} from "./hostelCompleteness.js";

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (error, rows) => {
      if (error) return reject(error);
      resolve(rows);
    });
  });

const parseJson = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
};

const loadHostelSources = async (hostelIds) => {
  const bundles = new Map(
    hostelIds.map((id) => [id, { rooms: [], photos: [], listing: null }])
  );
  if (!hostelIds.length) return bundles;

  const placeholders = hostelIds.map(() => "?").join(",");
  const [rooms, photos, listings] = await Promise.all([
    query(`SELECT * FROM hostel_rooms WHERE hostel_id IN (${placeholders})`, hostelIds),
    query(
      `SELECT * FROM hostel_photos WHERE hostel_id IN (${placeholders})
       ORDER BY is_cover DESC, created_at ASC`,
      hostelIds
    ),
    query(
      `SELECT * FROM hostel_listing_details WHERE hostel_id IN (${placeholders})`,
      hostelIds
    ),
  ]);

  for (const room of rooms) bundles.get(room.hostel_id)?.rooms.push(room);
  for (const photo of photos) bundles.get(photo.hostel_id)?.photos.push(photo);
  for (const listing of listings) {
    const bundle = bundles.get(listing.hostel_id);
    if (bundle) bundle.listing = listing;
  }
  return bundles;
};

const amenityList = (value) => {
  const amenities = parseJson(value, {});
  const source = Array.isArray(amenities)
    ? amenities
    : [
        ...(Array.isArray(amenities?.inRoom?.items) ? amenities.inRoom.items : []),
        ...(Array.isArray(amenities?.facilities) ? amenities.facilities : []),
      ];
  return source
    .map((item) => (typeof item === "string" ? item : item?.name))
    .filter(Boolean);
};

const ruleList = (value) => {
  const rules = parseJson(value, []);
  const list = Array.isArray(rules) ? rules : typeof rules === "string" ? [rules] : [];
  return list
    .map((rule) =>
      typeof rule === "string"
        ? rule.trim()
        : [rule?.category, rule?.text].filter(Boolean).join(": ")
    )
    .filter(Boolean);
};

const otherFees = (fees = {}) =>
  Object.entries(fees)
    .filter(([key, value]) => key !== "security" && key !== "inquiry" && value != null && value !== "")
    .map(([key, value]) =>
      typeof value === "object"
        ? { label: key, amount: value.amount ?? value.fee ?? value.value ?? "" }
        : { label: key, amount: value }
    );

export const getPublicHostels = async (req, res) => {
  try {
    const universityId = String(req.query.university_id || "").trim();
    const universityFilter = universityId ? " AND c.university_id = ?" : "";
    const params = universityId ? [universityId] : [];
    const hostels = await query(
      `SELECT h.*, c.name AS campus_name, c.city AS campus_city, d.gender
       FROM hostels h
       LEFT JOIN campuses c ON c.id = h.campus_id
       LEFT JOIN hostel_listing_details d ON d.hostel_id = h.id
       WHERE h.status = 'approved'${universityFilter}
       ORDER BY h.created_at DESC
       LIMIT 60`,
      params
    );

    const bundles = await loadHostelSources(hostels.map((hostel) => hostel.id));
    const cards = hostels
      .map((hostel) => {
        const bundle = bundles.get(hostel.id);
        const completion = evaluateHostelCompletion(hostel, bundle);
        if (!completion.isLive) return null;
        const cover =
          bundle.photos.find((photo) => Number(photo.is_cover) === 1) ||
          bundle.photos[0] ||
          null;

        return {
          id: hostel.id,
          name: hostel.name,
          hostel_type: hostel.hostel_type,
          type_label: hostel.hostel_type === "university" ? "Campus Hostel" : "Private Hostel",
          gender: bundle.listing?.gender || null,
          campus_name: hostel.campus_name || null,
          campus_city: hostel.campus_city || null,
          location: hostel.hostel_type === "university"
            ? hostel.campus_name || hostel.address
            : hostel.address,
          nearby_distance: hostel.nearby_distance || null,
          rent_min: completion.counts.rentMin,
          rent_max: completion.counts.rentMax,
          rooms_count: completion.counts.roomsCount,
          seats_available: completion.counts.seatsAvailable,
          photos_count: completion.counts.photosCount,
          amenities: listingAmenityNames(bundle.listing),
          cover_photo: cover?.image_url || null,
        };
      })
      .filter(Boolean);

    const campusHostels = await query(
      `SELECT ch.*, c.name AS campus_name, c.city AS campus_city, c.cover_image AS campus_cover
       FROM campus_hostels ch
       LEFT JOIN campuses c ON c.id = ch.campus_id
       WHERE ch.status IN ('live', 'approved')${universityFilter}
       ORDER BY ch.created_at DESC`,
      params
    );

    const campusIds = campusHostels.map((hostel) => hostel.id);
    let photosByHostel = new Map();
    if (campusIds.length) {
      const placeholders = campusIds.map(() => "?").join(",");
      const photos = await query(
        `SELECT * FROM campus_hostel_photos
         WHERE hostel_id IN (${placeholders})
         ORDER BY is_cover DESC, sort_order ASC, created_at ASC`,
        campusIds
      );
      photosByHostel = photos.reduce((map, photo) => {
        if (!map.has(photo.hostel_id)) map.set(photo.hostel_id, []);
        map.get(photo.hostel_id).push(photo);
        return map;
      }, new Map());
    }

    const campusCards = campusHostels.map((hostel) => {
      const photos = photosByHostel.get(hostel.id) || [];
      const amenities = parseJson(hostel.amenities, []);
      const rentMin = Number(hostel.rent_min);
      return {
        id: hostel.id,
        name: hostel.name,
        hostel_type: "university",
        type_label: "Campus Hostel",
        gender: hostel.gender ? String(hostel.gender).toLowerCase() : null,
        campus_name: hostel.campus_name || null,
        campus_city: hostel.campus_city || null,
        location: hostel.address || hostel.walk_dist || hostel.campus_name || "",
        nearby_distance: hostel.walk_dist ||
          (hostel.distance_km != null ? `${Number(hostel.distance_km)} km from campus` : null),
        rent_min: Number.isFinite(rentMin) ? rentMin : null,
        rent_max: null,
        rooms_count: Number(hostel.rooms || 0),
        seats_available: 0,
        photos_count: photos.length,
        amenities: (Array.isArray(amenities) ? amenities : [])
          .map((item) => (typeof item === "string" ? item : item?.name))
          .filter(Boolean),
        cover_photo: photos[0]?.image_url || hostel.campus_cover || null,
      };
    });

    return res.json({ hostels: [...cards, ...campusCards] });
  } catch (error) {
    console.error("Get public hostels error:", error);
    return res.status(500).json({ message: "Could not load hostels." });
  }
};

export const getPublicHostelById = async (req, res) => {
  try {
    const rows = await query(
      `SELECT h.*, c.name AS campus_name, c.city AS campus_city,
              c.lat AS campus_lat, c.lng AS campus_lng
       FROM hostels h
       LEFT JOIN campuses c ON c.id = h.campus_id
       WHERE h.id = ? AND h.status = 'approved'
       LIMIT 1`,
      [req.params.id]
    );

    if (rows.length) {
      const hostel = rows[0];
      const bundle = (await loadHostelSources([hostel.id])).get(hostel.id);
      const completion = evaluateHostelCompletion(hostel, bundle);
      if (!completion.isLive) {
        return res.status(404).json({ message: "This hostel is not published yet." });
      }

      const listing = bundle.listing || {};
      const amenities = parseJson(listing.amenities, {});
      const inRoom = parseJson(amenities?.inRoom, {});
      const facilities = (
        Array.isArray(amenities) ? amenities : parseJson(amenities?.facilities, [])
      )
        .map((item) => typeof item === "string" ? { name: item, amount: null } : item)
        .filter((item) => item?.name);
      const fees = parseJson(listing.additional_fees, {});
      const security = parseJson(fees.security, {});
      const messDetails = parseJson(listing.mess_details, {});
      const mess = parseJson(messDetails.mess, {});

      return res.json({
        hostel: {
          id: hostel.id,
          source: "registered",
          name: hostel.name,
          hostelType: hostel.hostel_type,
          isCampus: hostel.hostel_type === "university",
          typeLabel: hostel.hostel_type === "university" ? "Campus Hostel" : "Private Hostel",
          gender: listing.gender || null,
          campusName: hostel.campus_name || null,
          campusCity: hostel.campus_city || null,
          campusLat: hostel.campus_lat != null ? Number(hostel.campus_lat) : null,
          campusLng: hostel.campus_lng != null ? Number(hostel.campus_lng) : null,
          address: hostel.address || null,
          nearbyDistance: hostel.nearby_distance || null,
          floors: hostel.floors || null,
          lat: hostel.lat != null ? Number(hostel.lat) : null,
          lng: hostel.lng != null ? Number(hostel.lng) : null,
          description: listing.description || null,
          ownerName: hostel.owner_name || null,
          ownerContact: hostel.owner_contact || null,
          wardenName: hostel.warden_name || null,
          wardenContact: hostel.warden_contact || null,
          contactPhone: listing.contact_phone || null,
          contactEmail: listing.contact_email || null,
          inquiryNumber: fees.inquiry || null,
          checkIn: listing.check_in_time || null,
          checkOut: listing.check_out_time || null,
          rentMin: completion.counts.rentMin,
          rentMax: completion.counts.rentMax,
          roomsCount: completion.counts.roomsCount,
          roomTypes: completion.counts.roomTypes,
          totalSeats: completion.counts.totalSeats,
          seatsAvailable: completion.counts.seatsAvailable,
          photos: bundle.photos.map((photo) => ({
            id: photo.id,
            url: photo.image_url,
            caption: photo.caption || null,
            isCover: Number(photo.is_cover) === 1,
          })),
          rooms: bundle.rooms.map((room) => ({
            id: room.id,
            type: room.room_type,
            totalRooms: Number(room.total_rooms || 0),
            bedsPerRoom: Number(room.beds_per_room || 0),
            availableBeds: Number(room.available_beds || 0),
            monthlyRent: Number(room.monthly_rent || 0),
            description: room.description || null,
          })),
          amenities: amenityList(listing.amenities),
          inRoomItems: (Array.isArray(inRoom?.items) ? inRoom.items : [])
            .map((item) => typeof item === "string" ? item : item?.name)
            .filter(Boolean),
          facilities,
          mess: mess && Object.keys(mess).length
            ? {
                available: mess.available ?? null,
                charges: mess.charges || null,
                menuPhoto: mess.menuPhoto || null,
                menu: mess.menuManual || mess.menu || null,
              }
            : null,
          securityFee: security.fee ?? null,
          securityTypes: Array.isArray(security.types) ? security.types : [],
          otherFees: otherFees(fees),
          rules: ruleList(listing.hostel_rules),
        },
      });
    }

    const campusRows = await query(
      `SELECT ch.*, c.name AS campus_name, c.city AS campus_city,
              c.lat AS campus_lat, c.lng AS campus_lng
       FROM campus_hostels ch
       LEFT JOIN campuses c ON c.id = ch.campus_id
       WHERE ch.id = ? AND ch.status IN ('live', 'approved')
       LIMIT 1`,
      [req.params.id]
    );
    if (!campusRows.length) {
      return res.status(404).json({ message: "Hostel not found." });
    }

    const hostel = campusRows[0];
    const photos = await query(
      `SELECT id, image_url, caption, is_cover
       FROM campus_hostel_photos
       WHERE hostel_id = ?
       ORDER BY is_cover DESC, sort_order ASC, created_at ASC`,
      [hostel.id]
    );
    const rooms = parseJson(hostel.rooms_detail, []);
    const rentMin = Number(hostel.rent_min);
    const amenities = parseJson(hostel.amenities, []);

    return res.json({
      hostel: {
        id: hostel.id,
        source: "campus",
        name: hostel.name,
        hostelType: "university",
        isCampus: true,
        typeLabel: "Campus Hostel",
        gender: hostel.gender ? String(hostel.gender).toLowerCase() : null,
        campusName: hostel.campus_name || null,
        campusCity: hostel.campus_city || null,
        campusLat: hostel.campus_lat != null ? Number(hostel.campus_lat) : null,
        campusLng: hostel.campus_lng != null ? Number(hostel.campus_lng) : null,
        address: hostel.address || hostel.walk_dist || null,
        nearbyDistance: hostel.walk_dist || null,
        floors: null,
        lat: hostel.latitude != null ? Number(hostel.latitude) : null,
        lng: hostel.longitude != null ? Number(hostel.longitude) : null,
        description: null,
        ownerName: hostel.vendor_name || null,
        ownerContact: hostel.contact || null,
        wardenName: null,
        wardenContact: null,
        contactPhone: hostel.contact || null,
        contactEmail: null,
        inquiryNumber: hostel.contact || null,
        checkIn: null,
        checkOut: null,
        rentMin: Number.isFinite(rentMin) ? rentMin : null,
        rentMax: null,
        roomsCount: Number(hostel.rooms || 0),
        roomTypes: Array.isArray(rooms) ? rooms.length : 0,
        totalSeats: null,
        seatsAvailable: null,
        photos: photos.map((photo) => ({
          id: photo.id,
          url: photo.image_url,
          caption: photo.caption || null,
          isCover: Number(photo.is_cover) === 1,
        })),
        rooms: Array.isArray(rooms) ? rooms : [],
        amenities: (Array.isArray(amenities) ? amenities : [])
          .map((item) => typeof item === "string" ? item : item?.name)
          .filter(Boolean),
        inRoomItems: [],
        facilities: [],
        mess: null,
        securityFee: null,
        securityTypes: [],
        otherFees: [],
        rules: [],
      },
    });
  } catch (error) {
    console.error("Get public hostel detail error:", error);
    return res.status(500).json({ message: "Could not load hostel details." });
  }
};

export const getHostelCompletion = async (req, res) => {
  try {
    const rows = await query(
      `SELECT h.*, c.name AS campus_name
       FROM hostels h
       LEFT JOIN campuses c ON c.id = h.campus_id
       WHERE h.id = ? AND h.owner_uid = ?
       LIMIT 1`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Hostel not found." });
    }

    const hostel = rows[0];
    const ownerRole = hostel.hostel_type === "university" ? "campus_hostel" : "hostel";
    if (req.user.role !== ownerRole) {
      return res.status(403).json({ message: "This hostel does not belong to your account type." });
    }

    const bundle = (await loadHostelSources([hostel.id])).get(hostel.id);
    return res.json({
      completion: evaluateHostelCompletion(hostel, bundle),
      hostel,
    });
  } catch (error) {
    console.error("Get hostel completion error:", error);
    return res.status(500).json({ message: "Could not load hostel completion." });
  }
};
