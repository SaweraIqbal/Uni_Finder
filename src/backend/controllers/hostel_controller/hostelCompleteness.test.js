import test from "node:test";
import assert from "node:assert/strict";
import { evaluateHostelCompletion } from "./hostelCompleteness.js";

test("approved hostels remain unpublished until every required detail is complete", () => {
  const result = evaluateHostelCompletion(
    { status: "approved", hostel_type: "private" },
    { rooms: [], photos: [], listing: null }
  );

  assert.equal(result.displayStatus, "pending_details");
  assert.equal(result.isLive, false);
  assert.ok(result.missing.length > 0);
});

test("approved complete hostel is live and reports its room counts", () => {
  const result = evaluateHostelCompletion(
    {
      status: "approved",
      hostel_type: "private",
      name: "North House",
      address: "Main Road",
      nearby_distance: "1 km from campus",
      lat: 31.5,
      lng: 74.3,
      floors: 3,
      owner_name: "Owner",
      owner_contact: "03000000000",
      warden_name: "Warden",
      warden_contact: "03000000001",
    },
    {
      rooms: [{
        monthly_rent: 25000,
        total_rooms: 4,
        beds_per_room: 2,
        available_beds: 3,
      }],
      photos: [{ id: "cover" }],
      listing: {
        description: "Student accommodation",
        gender: "boys",
        additional_fees: JSON.stringify({
          security: { fee: 10000, types: ["refundable"] },
          inquiry: "03000000002",
        }),
        amenities: JSON.stringify({ facilities: [{ name: "Wi-Fi" }] }),
        mess_details: JSON.stringify({ mess: { available: false } }),
        hostel_rules: JSON.stringify([{ text: "No smoking" }]),
      },
    }
  );

  assert.equal(result.displayStatus, "live");
  assert.equal(result.isLive, true);
  assert.equal(result.completeness, 100);
  assert.equal(result.counts.roomsCount, 4);
  assert.equal(result.counts.totalSeats, 8);
});

test("rejected hostels cannot be published even when their details are complete", () => {
  const result = evaluateHostelCompletion(
    {
      status: "rejected",
      hostel_type: "private",
      name: "North House",
      address: "Main Road",
      nearby_distance: "1 km from campus",
      lat: 31.5,
      lng: 74.3,
      floors: 3,
      owner_name: "Owner",
      owner_contact: "03000000000",
      warden_name: "Warden",
      warden_contact: "03000000001",
    },
    {
      rooms: [{ monthly_rent: 25000 }],
      photos: [{ id: "cover" }],
      listing: {
        description: "Student accommodation",
        gender: "boys",
        additional_fees: JSON.stringify({
          security: { fee: 10000, types: ["refundable"] },
          inquiry: "03000000002",
        }),
        amenities: JSON.stringify({ facilities: [{ name: "Wi-Fi" }] }),
        mess_details: JSON.stringify({ mess: { available: false } }),
        hostel_rules: JSON.stringify([{ text: "No smoking" }]),
      },
    }
  );

  assert.equal(result.displayStatus, "rejected");
  assert.equal(result.isLive, false);
});
