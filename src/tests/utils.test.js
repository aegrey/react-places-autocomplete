import {
  geocodeByAddress,
  geocodeByPlaceId,
  geocodeByCoordinates,
} from '../utils';
import { setupGoogleMock } from './helpers/setup';

beforeAll(() => {
  setupGoogleMock();
});

describe('geocodeByAddress', () => {
  it('geocodes valid address', () => {
    expect.assertions(1);
    return geocodeByAddress('San Francisco, CA').then(results => {
      expect(results).toMatchSnapshot();
    });
  });

  it('rejects invalid address', () => {
    expect.assertions(1);
    return geocodeByAddress('someinvalidaddress').catch(error => {
      expect(error).toBeDefined();
    });
  });
});

describe('geocodeByPlaceId', () => {
  it('geocode valid placeID', () => {
    expect.assertions(1);
    /* placeID of San Francisco */
    return geocodeByPlaceId('ChIJIQBpAG2ahYAR_6128GcTUEo').then(results => {
      expect(results).toMatchSnapshot();
    });
  });
});

describe('geocodeByCoordinates', () => {
  it('geocodes valid coordinates', () => {
    expect.assertions(1);
    return geocodeByCoordinates(43.1686272, -79.469774).then(results => {
      expect(results[0]).toMatchSnapshot();
    });
  });

  it('rejects invalid coordinates', () => {
    expect.assertions(1);
    return geocodeByCoordinates(1, -7).catch(error => {
      expect(error).toBeDefined();
    });
  });
});
/* TODO: test getLatLng */
