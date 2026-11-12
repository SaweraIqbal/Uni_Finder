const DEFAULT_CENTER = "30.3753,69.3451";

export default function GoogleMapPreview({
  lat,
  lng,
  zoom = 16,
  className = "",
  title = "Hostel location",
}) {
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  const hasCoords = Number.isFinite(numLat) && Number.isFinite(numLng);

  const src = hasCoords
    ? `https://www.google.com/maps?q=${numLat},${numLng}&z=${zoom}&output=embed`
    : `https://www.google.com/maps?q=${DEFAULT_CENTER}&z=5&output=embed`;

  return (
    <iframe
      title={title}
      src={src}
      className={className}
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
