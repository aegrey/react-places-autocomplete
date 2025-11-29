import React from 'react';

export default function GeocodeLatlng() {
  const [lat, setLat] = React.useState(null);
  const [lng, setLng] = React.useState(null);

  function handleGeocodeLatLng() {}

  return (
    <div className="container">
      <input
        type="number"
        placeholder="LAT"
        value={lat}
        onChange={e => setLat(e.target.value)}
      />
      <input
        type="number"
        placeholder="LNG"
        value={lng}
        onChange={e => setLng(e.target.value)}
      />
      <button onClick={handleGeocodeLatLng}>Geocode</button>
    </div>
  );
}
