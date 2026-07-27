export const toGeoPoint = (lat, lng) => ({
  type: "Point",
  coordinates: [Number(lng), Number(lat)],
});

export const nearQuery = (lat, lng, radiusMeters) => ({
  "location.coordinates": {
    $near: {
      $geometry: toGeoPoint(lat, lng),
      $maxDistance: radiusMeters,
    },
  },
});
