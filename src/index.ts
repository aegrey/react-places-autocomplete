import PlacesAutocomplete from './PlacesAutocomplete';

export { geocodeByAddress, geocodeByPlaceId, getLatLng } from './google';
export type {
  PlacesAutocompleteProps,
  PlacesAutocompleteRenderArgs,
  SearchOptions,
  Suggestion,
} from './types';

export default PlacesAutocomplete;
