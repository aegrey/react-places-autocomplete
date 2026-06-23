import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import PlacesAutocomplete, {
  geocodeByAddress,
  geocodeByPlaceId,
  getLatLng,
} from './index';
import { fetchAutocompleteSuggestions } from './google';
import type { PlacesAutocompleteProps } from './types';

const suggestions = [
  {
    placePrediction: {
      mainText: { text: '123 Main St' },
      placeId: 'place-1',
      secondaryText: { text: 'Buffalo, NY' },
      text: { text: '123 Main St, Buffalo, NY' },
      types: ['street_address'],
    },
  },
  {
    placePrediction: {
      mainText: { text: '123 Main Ave' },
      placeId: 'place-2',
      secondaryText: { text: 'Rochester, NY' },
      text: { text: '123 Main Ave, Rochester, NY' },
      types: ['street_address'],
    },
  },
];

function setupGoogleMock() {
  const fetchAutocompleteSuggestions = vi.fn().mockResolvedValue({
    suggestions,
  });

  class AutocompleteSessionToken {}

  class Geocoder {
    geocode(
      request: { placeId?: string },
      callback: (results: unknown[], status: string) => void
    ) {
      if (request.placeId === 'place-1') {
        callback([{ formatted_address: '123 Main St, Buffalo, NY' }], 'OK');
        return;
      }

      callback([], 'ZERO_RESULTS');
    }
  }

  window.google = {
    maps: {
      Geocoder,
      GeocoderStatus: {
        OK: 'OK',
      },
      places: {
        AutocompleteSessionToken,
        AutocompleteSuggestion: {
          fetchAutocompleteSuggestions,
        },
        PlacesServiceStatus: {
          OK: 'OK',
          ZERO_RESULTS: 'ZERO_RESULTS',
        },
      },
    },
  } as unknown as typeof google;

  return { fetchAutocompleteSuggestions };
}

function setupLegacyGoogleMock() {
  class Geocoder {
    geocode(
      request: { address?: string; placeId?: string },
      callback: (results: unknown[], status: string) => void
    ) {
      if (request.address === '123 Main St' || request.placeId === 'place-1') {
        callback(
          [
            {
              formatted_address: '123 Main St, Buffalo, NY',
              geometry: {
                location: {
                  lat: () => 42.8864,
                  lng: () => -78.8784,
                },
              },
            },
          ],
          'OK'
        );
        return;
      }

      callback([], 'ZERO_RESULTS');
    }
  }

  class AutocompleteService {
    getPlacePredictions(
      _request: unknown,
      callback: (predictions: unknown[], status: string) => void
    ) {
      callback(
        [
          {
            description: '123 Legacy St, Buffalo, NY',
            matched_substrings: [{ length: 3, offset: 0 }],
            place_id: 'legacy-place',
            structured_formatting: {
              main_text: '123 Legacy St',
              secondary_text: 'Buffalo, NY',
            },
            terms: [{ offset: 0, value: '123 Legacy St' }],
            types: ['street_address'],
          },
        ],
        'OK'
      );
    }
  }

  window.google = {
    maps: {
      Geocoder,
      GeocoderStatus: {
        OK: 'OK',
      },
      places: {
        AutocompleteService,
        PlacesServiceStatus: {
          OK: 'OK',
          ZERO_RESULTS: 'ZERO_RESULTS',
        },
      },
    },
  } as unknown as typeof google;
}

function TestAutocomplete({
  onSelect = vi.fn(),
}: {
  onSelect?: PlacesAutocompleteProps['onSelect'];
}) {
  const [value, setValue] = React.useState('');

  return (
    <PlacesAutocomplete
      debounce={0}
      onChange={setValue}
      onSelect={onSelect}
      searchOptions={{ types: ['address'] }}
      value={value}
    >
      {({ getInputProps, getSuggestionItemProps, loading, suggestions }) => (
        <div>
          <input aria-label="Address" {...getInputProps()} />
          {loading ? <div>Loading</div> : null}
          <div>
            {suggestions.map(suggestion => (
              <button
                key={suggestion.placeId}
                type="button"
                {...getSuggestionItemProps(suggestion)}
              >
                {suggestion.description}
              </button>
            ))}
          </div>
        </div>
      )}
    </PlacesAutocomplete>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete (window as Partial<typeof window>).google;
});

describe('PlacesAutocomplete', () => {
  it('fetches suggestions from the current Google AutocompleteSuggestion API', async () => {
    const { fetchAutocompleteSuggestions } = setupGoogleMock();
    render(<TestAutocomplete />);

    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: '123 main' },
    });

    expect(await screen.findByText('123 Main St, Buffalo, NY')).toBeVisible();
    expect(fetchAutocompleteSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({
        input: '123 main',
        sessionToken: expect.any(Object),
      })
    );
    expect(fetchAutocompleteSuggestions.mock.calls[0][0]).not.toHaveProperty(
      'types'
    );
  });

  it('calls onSelect with the selected suggestion details', async () => {
    setupGoogleMock();
    const onSelect = vi.fn();
    render(<TestAutocomplete onSelect={onSelect} />);

    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: '123 main' },
    });

    fireEvent.click(await screen.findByText('123 Main St, Buffalo, NY'));

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(
        '123 Main St, Buffalo, NY',
        'place-1',
        expect.objectContaining({
          description: '123 Main St, Buffalo, NY',
          placeId: 'place-1',
        })
      );
    });
  });

  it('selects the active suggestion with Enter', async () => {
    setupGoogleMock();
    const onSelect = vi.fn();
    render(<TestAutocomplete onSelect={onSelect} />);

    const input = screen.getByLabelText('Address');
    fireEvent.change(input, { target: { value: '123 main' } });
    await screen.findByText('123 Main St, Buffalo, NY');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith(
      '123 Main St, Buffalo, NY',
      'place-1',
      expect.objectContaining({ placeId: 'place-1' })
    );
  });

  it('handles escape, blur, and active suggestion mouse state', async () => {
    setupGoogleMock();
    render(<TestAutocomplete />);

    const input = screen.getByLabelText('Address');
    fireEvent.change(input, { target: { value: '123 main' } });
    const firstSuggestion = await screen.findByText('123 Main St, Buffalo, NY');

    fireEvent.mouseEnter(firstSuggestion);
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      'PlacesAutocomplete__suggestion-place-1'
    );

    fireEvent.mouseLeave(firstSuggestion);
    expect(input).not.toHaveAttribute('aria-activedescendant');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(
      screen.queryByText('123 Main St, Buffalo, NY')
    ).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: '123 main again' } });
    await screen.findByText('123 Main St, Buffalo, NY');
    fireEvent.blur(input);
    await waitFor(() => {
      expect(
        screen.queryByText('123 Main St, Buffalo, NY')
      ).not.toBeInTheDocument();
    });
  });

  it('calls onChange with the typed value and can skip suggestion fetches', async () => {
    const { fetchAutocompleteSuggestions } = setupGoogleMock();
    const onChange = vi.fn();

    function NoFetchAutocomplete() {
      const [value, setValue] = React.useState('');
      return (
        <PlacesAutocomplete
          debounce={0}
          onChange={nextValue => {
            setValue(nextValue);
            onChange(nextValue);
          }}
          shouldFetchSuggestions={false}
          value={value}
        >
          {({ getInputProps, suggestions }) => (
            <div>
              <input aria-label="Manual address" {...getInputProps()} />
              <span>{suggestions.length}</span>
            </div>
          )}
        </PlacesAutocomplete>
      );
    }

    render(<NoFetchAutocomplete />);
    fireEvent.change(screen.getByLabelText('Manual address'), {
      target: { value: 'typed address' },
    });

    expect(onChange).toHaveBeenCalledWith('typed address');
    await waitFor(() => {
      expect(fetchAutocompleteSuggestions).not.toHaveBeenCalled();
    });
  });

  it('surfaces Google autocomplete errors', async () => {
    const { fetchAutocompleteSuggestions } = setupGoogleMock();
    fetchAutocompleteSuggestions.mockRejectedValueOnce('REQUEST_DENIED');
    const onError = vi.fn();

    function ErrorAutocomplete() {
      const [value, setValue] = React.useState('');
      return (
        <PlacesAutocomplete
          debounce={0}
          onChange={setValue}
          onError={onError}
          value={value}
        >
          {({ getInputProps }) => (
            <input aria-label="Error address" {...getInputProps()} />
          )}
        </PlacesAutocomplete>
      );
    }

    render(<ErrorAutocomplete />);
    fireEvent.change(screen.getByLabelText('Error address'), {
      target: { value: 'denied' },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        'REQUEST_DENIED',
        expect.any(Function)
      );
    });
  });

  it('supports deferred Google initialization callbacks', async () => {
    render(
      <PlacesAutocomplete
        googleCallbackName="initPlaces"
        onChange={vi.fn()}
        value=""
      >
        {({ getInputProps }) => (
          <input aria-label="Deferred address" {...getInputProps()} />
        )}
      </PlacesAutocomplete>
    );

    expect(screen.getByLabelText('Deferred address')).toBeDisabled();
    setupGoogleMock();
    (window.initPlaces as () => void)();

    await waitFor(() => {
      expect(screen.getByLabelText('Deferred address')).not.toBeDisabled();
    });
  });

  it('rejects controlled input props passed to getInputProps', () => {
    setupGoogleMock();

    expect(() =>
      render(
        <PlacesAutocomplete onChange={vi.fn()} value="">
          {({ getInputProps }) => (
            <input
              aria-label="Invalid address"
              {...getInputProps({ value: 'invalid' })}
            />
          )}
        </PlacesAutocomplete>
      )
    ).toThrow('getInputProps does not accept `value`');

    cleanup();

    expect(() =>
      render(
        <PlacesAutocomplete onChange={vi.fn()} value="">
          {({ getInputProps }) => (
            <input
              aria-label="Invalid address"
              {...getInputProps({ onChange: vi.fn() })}
            />
          )}
        </PlacesAutocomplete>
      )
    ).toThrow('getInputProps does not accept `onChange`');
  });

  it('geocodes a selected place id', async () => {
    setupGoogleMock();

    await expect(geocodeByPlaceId('place-1')).resolves.toEqual([
      { formatted_address: '123 Main St, Buffalo, NY' },
    ]);
    await expect(geocodeByPlaceId('missing')).rejects.toBe('ZERO_RESULTS');
  });

  it('supports legacy Google autocomplete and geocoder helpers', async () => {
    setupLegacyGoogleMock();

    await expect(
      fetchAutocompleteSuggestions({
        highlightFirstSuggestion: true,
        input: 'legacy',
        searchOptions: { types: ['address'] },
        sessionToken: undefined,
      })
    ).resolves.toEqual([
      expect.objectContaining({
        active: true,
        description: '123 Legacy St, Buffalo, NY',
        formattedSuggestion: {
          mainText: '123 Legacy St',
          secondaryText: 'Buffalo, NY',
        },
        placeId: 'legacy-place',
      }),
    ]);

    const results = await geocodeByAddress('123 Main St');
    await expect(getLatLng(results[0])).resolves.toEqual({
      lat: 42.8864,
      lng: -78.8784,
    });
    await expect(geocodeByAddress('missing')).rejects.toBe('ZERO_RESULTS');
  });

  it('throws when Google places is unavailable', () => {
    expect(() =>
      render(
        <PlacesAutocomplete onChange={vi.fn()} value="">
          {({ getInputProps }) => (
            <input aria-label="Missing Google" {...getInputProps()} />
          )}
        </PlacesAutocomplete>
      )
    ).toThrow('Google Maps JavaScript API with the places library');
  });
});
