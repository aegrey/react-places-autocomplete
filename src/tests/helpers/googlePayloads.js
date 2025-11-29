export const GEOCODE_RESULT = {
  'San Francisco': [
    {
      address_components: [
        {
          long_name: 'San Francisco',
          short_name: 'SF',
          types: ['locality', 'political'],
        },
        {
          long_name: 'San Francisco County',
          short_name: 'San Francisco County',
          types: ['administrative_area_level_2', 'political'],
        },
        {
          long_name: 'California',
          short_name: 'CA',
          types: ['administrative_area_level_1', 'political'],
        },
        {
          long_name: 'United States',
          short_name: 'US',
          types: ['country', 'political'],
        },
      ],
      formatted_address: 'San Francisco, CA, USA',
      geometry: {
        bounds: {
          south: 37.6398299,
          west: -123.17382499999997,
          north: 37.9298239,
          east: -122.28178000000003,
        },
        location: { lat: 37.7749295, lng: -122.41941550000001 },
        location_type: 'APPROXIMATE',
        viewport: {
          south: 37.70339999999999,
          west: -122.52699999999999,
          north: 37.812,
          east: -122.34820000000002,
        },
      },
      place_id: 'ChIJIQBpAG2ahYAR_6128GcTUEo',
      types: ['locality', 'political'],
    },
  ],
};

export const GEOCODE_COORDS_RESULT = {
  address_components: [
    {
      long_name: '4328',
      short_name: '4328',
      types: ['street_number'],
    },
    {
      long_name: 'Arejay Avenue',
      short_name: 'Arejay Ave',
      types: ['route'],
    },
    {
      long_name: 'Beamsville',
      short_name: 'Beamsville',
      types: ['neighborhood', 'political'],
    },
    {
      long_name: 'Lincoln',
      short_name: 'Lincoln',
      types: ['locality', 'political'],
    },
    {
      long_name: 'Lincoln',
      short_name: 'Lincoln',
      types: ['administrative_area_level_3', 'political'],
    },
    {
      long_name: 'Regional Municipality of Niagara',
      short_name: 'Regional Municipality of Niagara',
      types: ['administrative_area_level_2', 'political'],
    },
    {
      long_name: 'Ontario',
      short_name: 'ON',
      types: ['administrative_area_level_1', 'political'],
    },
    {
      long_name: 'Canada',
      short_name: 'CA',
      types: ['country', 'political'],
    },
    {
      long_name: 'L3J 0P7',
      short_name: 'L3J 0P7',
      types: ['postal_code'],
    },
  ],
  formatted_address: '4328 Arejay Ave, Beamsville, ON L3J 0P7, Canada',
  geometry: {
    bounds: {
      south: 43.1685646,
      west: -79.4698812,
      north: 43.1686814,
      east: -79.46964960000001,
    },
    location: {
      lat: 43.1686272,
      lng: -79.469774,
    },
    location_type: 'ROOFTOP',
    viewport: {
      south: 43.1672740197085,
      west: -79.47111438029151,
      north: 43.1699719802915,
      east: -79.4684164197085,
    },
  },
  navigation_points: [
    {
      location: {
        latitude: 43.168617,
        longitude: -79.4695021,
      },
    },
  ],
  place_id: 'ChIJr55xLeCtLIgRUVmWJQFVsiI',
  types: ['premise', 'street_address'],
};
