import React from 'react';
import { mount } from 'enzyme';
import PlacesAutocomplete from '../..';
import { GEOCODE_COORDS_RESULT, GEOCODE_RESULT } from './googlePayloads';

class GeocoderMock {
  geocode({ address, placeId, location }, callback) {
    if (address) {
      this._geocodeAddress(address, callback);
    } else if (placeId) {
      this._geocodePlaceID(placeId, callback);
    } else if (location) {
      this._geocodeCoordinates(location.lat, location.lng, callback);
    } else {
      callback({}, 'ZERO_RESULTS');
    }
  }

  _geocodeAddress(address, callback) {
    if (address.startsWith('San Francisco')) {
      callback(GEOCODE_RESULT['San Francisco'], 'OK');
    } else {
      callback([], 'ZERO_RESULTS');
    }
  }

  _geocodeCoordinates(lat, lng, callback) {
    if (lat === 43.1686272 && lng === -79.469774) {
      callback(GEOCODE_COORDS_RESULT, 'OK');
    } else {
      callback([], 'ZERO_RESULTS');
    }
  }

  _geocodePlaceID(placeId, callback) {
    if (placeId === 'ChIJIQBpAG2ahYAR_6128GcTUEo') {
      callback(GEOCODE_RESULT['San Francisco'], 'OK');
    } else {
      callback([], 'ZERO_RESULTS');
    }
  }
}

class AutocompleteServiceMock {
  autocompleteService = {
    // eslint-disable-next-line no-unused-vars
    fetchAutocompleteSuggestions: _filters => {
      return [];
    },
  };
}

export const setupGoogleMock = () => {
  global.window.google = {
    maps: {
      places: {
        AutocompleteSuggestion: AutocompleteServiceMock,
        PlacesServiceStatus: {
          INVALID_REQUEST: 'INVALID_REQUEST',
          NOT_FOUND: 'NOT_FOUND',
          OK: 'OK',
          OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
          REQUEST_DENIED: 'REQUEST_DENIED',
          UNKNOWN_ERROR: 'UNKNOWN_ERROR',
          ZERO_RESULTS: 'ZERO_RESULTS',
        },
      },
      Geocoder: GeocoderMock,
      GeocoderStatus: {
        ERROR: 'ERROR',
        INVALID_REQUEST: 'INVALID_REQUEST',
        OK: 'OK',
        OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
        REQUEST_DENIED: 'REQUEST_DENIED',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR',
        ZERO_RESULTS: 'ZERO_RESULTS',
      },
    },
  };
};

const DEFAULT_PROPS = {
  value: '',
  onChange: () => {},
  onSelect: () => {},
  debounce: 200,
  highlightFirstSuggestion: false,
  shouldFetchSuggestions: true,
  searchOptions: {},
};

export const mountComponent = (props = {}) => {
  const _props = { ...DEFAULT_PROPS, ...props };
  return mount(
    <PlacesAutocomplete {..._props}>
      {({ getInputProps, suggestions, getSuggestionItemProps }) => (
        <div>
          <input {...getInputProps()} />
          <div>
            {suggestions.map(
              suggestion => (
                /* eslint-disable react/jsx-key */
                <div
                  {...getSuggestionItemProps(suggestion, {
                    'data-test': 'suggestion-item',
                  })}
                >
                  <span>{suggestion.description}</span>
                </div>
              )
              /* eslint-enable react/jsx-key */
            )}
          </div>
        </div>
      )}
    </PlacesAutocomplete>
  );
};
