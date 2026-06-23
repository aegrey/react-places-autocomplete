import type { SearchOptions, Suggestion } from './types';

type GeocoderResult = google.maps.GeocoderResult;

type LegacyPrediction = {
  description: string;
  matched_substrings?: Array<{ length: number; offset: number }>;
  place_id: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
  terms?: Array<{ offset: number; value: string }>;
  types?: string[];
};

type NewPlacePrediction = {
  mainText?: { text?: string };
  secondaryText?: { text?: string };
  placeId?: string;
  text?: { text?: string };
  types?: string[];
};

type NewAutocompleteSuggestion = {
  placePrediction?: NewPlacePrediction;
};

type NewPlacesLibrary = {
  AutocompleteSessionToken?: new () => unknown;
  AutocompleteSuggestion?: {
    fetchAutocompleteSuggestions: (request: SearchOptions) => Promise<{
      suggestions?: NewAutocompleteSuggestion[];
    }>;
  };
};

type LegacyAutocompleteService = {
  getPlacePredictions: (
    request: SearchOptions,
    callback: (predictions: LegacyPrediction[] | null, status: string) => void
  ) => void;
};

export const getGooglePlaces = (): typeof google.maps.places &
  NewPlacesLibrary => {
  if (!window.google?.maps?.places) {
    throw new Error(
      '[react-places-autocomplete]: Google Maps JavaScript API with the places library must be loaded before using PlacesAutocomplete.'
    );
  }

  return window.google.maps.places as typeof google.maps.places &
    NewPlacesLibrary;
};

export const isOkStatus = (status: unknown) =>
  status === window.google?.maps?.GeocoderStatus?.OK ||
  status === window.google?.maps?.places?.PlacesServiceStatus?.OK ||
  status === 'OK';

export const geocodeByPlaceId = (
  placeId: string
): Promise<GeocoderResult[]> => {
  const geocoder = new window.google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ placeId }, (results, status) => {
      if (!isOkStatus(status)) {
        reject(status);
        return;
      }

      resolve(results ?? []);
    });
  });
};

export const geocodeByAddress = (
  address: string
): Promise<GeocoderResult[]> => {
  const geocoder = new window.google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (!isOkStatus(status)) {
        reject(status);
        return;
      }

      resolve(results ?? []);
    });
  });
};

export const getLatLng = (
  result: GeocoderResult
): Promise<{ lat: number; lng: number }> => {
  try {
    return Promise.resolve({
      lat: result.geometry.location.lat(),
      lng: result.geometry.location.lng(),
    });
  } catch (error) {
    return Promise.reject(error);
  }
};

export const createAutocompleteSessionToken = () => {
  const places = getGooglePlaces();
  return places.AutocompleteSessionToken
    ? new places.AutocompleteSessionToken()
    : undefined;
};

const toSuggestion = (
  prediction: NewPlacePrediction,
  index: number,
  highlightFirstSuggestion: boolean
): Suggestion => {
  const description = prediction.text?.text ?? '';

  return {
    active: highlightFirstSuggestion && index === 0,
    description,
    formattedSuggestion: {
      mainText: prediction.mainText?.text ?? description,
      secondaryText: prediction.secondaryText?.text ?? '',
    },
    index,
    placeId: prediction.placeId ?? '',
    types: prediction.types,
  };
};

const toLegacySuggestion = (
  prediction: LegacyPrediction,
  index: number,
  highlightFirstSuggestion: boolean
): Suggestion => ({
  active: highlightFirstSuggestion && index === 0,
  description: prediction.description,
  formattedSuggestion: {
    mainText:
      prediction.structured_formatting?.main_text ?? prediction.description,
    secondaryText: prediction.structured_formatting?.secondary_text ?? '',
  },
  id: prediction.place_id,
  index,
  matchedSubstrings: prediction.matched_substrings,
  placeId: prediction.place_id,
  terms: prediction.terms,
  types: prediction.types,
});

const normalizeNewAutocompleteOptions = (
  searchOptions: SearchOptions,
  input: string,
  sessionToken: unknown
) => {
  const supportedOptions = { ...searchOptions };
  delete supportedOptions.types;

  return {
    ...supportedOptions,
    input,
    ...(sessionToken ? { sessionToken } : {}),
  };
};

export const fetchAutocompleteSuggestions = async ({
  highlightFirstSuggestion,
  input,
  searchOptions,
  sessionToken,
}: {
  highlightFirstSuggestion: boolean;
  input: string;
  searchOptions: SearchOptions;
  sessionToken: unknown;
}): Promise<Suggestion[]> => {
  const places = getGooglePlaces();

  if (places.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
    const response =
      await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
        normalizeNewAutocompleteOptions(searchOptions, input, sessionToken)
      );

    return (response.suggestions ?? [])
      .map(({ placePrediction }, index) =>
        placePrediction
          ? toSuggestion(placePrediction, index, highlightFirstSuggestion)
          : null
      )
      .filter((suggestion): suggestion is Suggestion =>
        Boolean(suggestion?.description && suggestion.placeId)
      );
  }

  const service =
    new window.google.maps.places.AutocompleteService() as unknown as
      | LegacyAutocompleteService
      | undefined;

  return new Promise((resolve, reject) => {
    service?.getPlacePredictions(
      { ...searchOptions, input },
      (predictions, status) => {
        if (!isOkStatus(status)) {
          reject(status);
          return;
        }

        resolve(
          (predictions ?? []).map((prediction, index) =>
            toLegacySuggestion(prediction, index, highlightFirstSuggestion)
          )
        );
      }
    );
  });
};
