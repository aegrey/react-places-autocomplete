import * as React from 'react';

import {
  createAutocompleteSessionToken,
  fetchAutocompleteSuggestions,
  getGooglePlaces,
} from './google';
import type {
  PlacesAutocompleteProps,
  SearchOptions,
  Suggestion,
} from './types';

const noop = () => {};

const defaultOnError = (status: unknown) => {
  console.error(
    '[react-places-autocomplete]: error happened when fetching data from Google Maps API.',
    status
  );
};

const compose =
  <T extends (...args: never[]) => void>(...handlers: Array<T | undefined>) =>
  (...args: Parameters<T>) => {
    handlers.forEach(handler => handler?.(...args));
  };

export default function PlacesAutocomplete({
  children,
  debounce = 200,
  googleCallbackName,
  highlightFirstSuggestion = false,
  onChange,
  onError = defaultOnError,
  onSelect,
  onSuggestions,
  searchOptions = {},
  shouldFetchSuggestions = true,
  value,
}: PlacesAutocompleteProps) {
  const [loading, setLoading] = React.useState(false);
  const [ready, setReady] = React.useState(!googleCallbackName);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [userInputValue, setUserInputValue] = React.useState(value);

  const debounceRef = React.useRef<ReturnType<typeof window.setTimeout> | null>(
    null
  );
  const mouseDownOnSuggestionRef = React.useRef(false);
  const requestIdRef = React.useRef(0);
  const sessionTokenRef = React.useRef<unknown>(undefined);

  const clearSuggestions = React.useCallback(() => {
    setSuggestions([]);
  }, []);

  const clearActive = React.useCallback(() => {
    setSuggestions(current =>
      current.map(suggestion => ({ ...suggestion, active: false }))
    );
  }, []);

  const init = React.useCallback(() => {
    getGooglePlaces();
    sessionTokenRef.current = createAutocompleteSessionToken();
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (!googleCallbackName) {
      init();
      return undefined;
    }

    const isPlacesLoaded = Boolean(window.google?.maps?.places);
    if (isPlacesLoaded) {
      init();
      return undefined;
    }

    window[googleCallbackName] = init;
    return () => {
      delete window[googleCallbackName];
    };
  }, [googleCallbackName, init]);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleFetchError = React.useCallback(
    (status: unknown) => {
      setLoading(false);
      onError(status, clearSuggestions);
    },
    [clearSuggestions, onError]
  );

  const fetchPredictions = React.useCallback(
    async (input: string, options: SearchOptions) => {
      if (!input) {
        clearSuggestions();
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setLoading(true);

      try {
        const nextSuggestions = await fetchAutocompleteSuggestions({
          highlightFirstSuggestion,
          input,
          searchOptions: options,
          sessionToken: sessionTokenRef.current,
        });

        if (requestIdRef.current !== requestId) {
          return;
        }

        onSuggestions?.(nextSuggestions);
        setSuggestions(nextSuggestions);
        setLoading(false);
      } catch (status) {
        if (requestIdRef.current === requestId) {
          handleFetchError(status);
        }
      }
    },
    [
      clearSuggestions,
      handleFetchError,
      highlightFirstSuggestion,
      onSuggestions,
    ]
  );

  const scheduleFetchPredictions = React.useCallback(
    (input: string) => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }

      debounceRef.current = window.setTimeout(() => {
        void fetchPredictions(input, searchOptions);
      }, debounce);
    },
    [debounce, fetchPredictions, searchOptions]
  );

  const handleSelect = React.useCallback(
    (
      address: string,
      placeId: string | null,
      suggestion: Suggestion | null
    ) => {
      clearSuggestions();
      sessionTokenRef.current = createAutocompleteSessionToken();

      if (onSelect) {
        onSelect(address, placeId, suggestion);
        return;
      }

      onChange(address);
    },
    [clearSuggestions, onChange, onSelect]
  );

  const getActiveSuggestion = React.useCallback(
    () => suggestions.find(suggestion => suggestion.active),
    [suggestions]
  );

  const setActiveAtIndex = React.useCallback((index: number) => {
    setSuggestions(current =>
      current.map((suggestion, suggestionIndex) => ({
        ...suggestion,
        active: suggestionIndex === index,
      }))
    );
  }, []);

  const selectActiveAtIndex = React.useCallback(
    (index: number) => {
      const activeName = suggestions.find(
        suggestion => suggestion.index === index
      )?.description;

      if (!activeName) {
        return;
      }

      setActiveAtIndex(index);
      onChange(activeName);
    },
    [onChange, setActiveAtIndex, suggestions]
  );

  const selectUserInputValue = React.useCallback(() => {
    clearActive();
    onChange(userInputValue);
  }, [clearActive, onChange, userInputValue]);

  const handleEnterKey = React.useCallback(() => {
    const activeSuggestion = getActiveSuggestion();

    if (!activeSuggestion) {
      handleSelect(value, null, null);
      return;
    }

    handleSelect(
      activeSuggestion.description,
      activeSuggestion.placeId,
      activeSuggestion
    );
  }, [getActiveSuggestion, handleSelect, value]);

  const handleDownKey = React.useCallback(() => {
    if (!suggestions.length) {
      return;
    }

    const activeSuggestion = getActiveSuggestion();
    if (!activeSuggestion) {
      selectActiveAtIndex(0);
    } else if (activeSuggestion.index === suggestions.length - 1) {
      selectUserInputValue();
    } else {
      selectActiveAtIndex(activeSuggestion.index + 1);
    }
  }, [
    getActiveSuggestion,
    selectActiveAtIndex,
    selectUserInputValue,
    suggestions,
  ]);

  const handleUpKey = React.useCallback(() => {
    if (!suggestions.length) {
      return;
    }

    const activeSuggestion = getActiveSuggestion();
    if (!activeSuggestion) {
      selectActiveAtIndex(suggestions.length - 1);
    } else if (activeSuggestion.index === 0) {
      selectUserInputValue();
    } else {
      selectActiveAtIndex(activeSuggestion.index - 1);
    }
  }, [
    getActiveSuggestion,
    selectActiveAtIndex,
    selectUserInputValue,
    suggestions,
  ]);

  const handleInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          handleEnterKey();
          break;
        case 'ArrowDown':
          event.preventDefault();
          handleDownKey();
          break;
        case 'ArrowUp':
          event.preventDefault();
          handleUpKey();
          break;
        case 'Escape':
          clearSuggestions();
          break;
        default:
          break;
      }
    },
    [clearSuggestions, handleDownKey, handleEnterKey, handleUpKey]
  );

  const handleInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      onChange(nextValue);
      setUserInputValue(nextValue);

      if (!nextValue) {
        clearSuggestions();
        return;
      }

      if (shouldFetchSuggestions) {
        scheduleFetchPredictions(nextValue);
      }
    },
    [
      clearSuggestions,
      onChange,
      scheduleFetchPredictions,
      shouldFetchSuggestions,
    ]
  );

  const handleInputBlur = React.useCallback(() => {
    if (!mouseDownOnSuggestionRef.current) {
      clearSuggestions();
    }
  }, [clearSuggestions]);

  const getActiveSuggestionId = React.useCallback(() => {
    const activeSuggestion = getActiveSuggestion();
    return activeSuggestion
      ? `PlacesAutocomplete__suggestion-${activeSuggestion.placeId}`
      : undefined;
  }, [getActiveSuggestion]);

  const getInputProps = React.useCallback(
    (options: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
      if (Object.prototype.hasOwnProperty.call(options, 'value')) {
        throw new Error(
          '[react-places-autocomplete]: getInputProps does not accept `value`. Use `value` prop instead.'
        );
      }

      if (Object.prototype.hasOwnProperty.call(options, 'onChange')) {
        throw new Error(
          '[react-places-autocomplete]: getInputProps does not accept `onChange`. Use `onChange` prop instead.'
        );
      }

      const { onBlur = noop, onKeyDown = noop, ...restOptions } = options;

      return {
        autoComplete: 'off',
        disabled: !ready,
        role: 'combobox',
        type: 'text',
        'aria-activedescendant': getActiveSuggestionId(),
        'aria-autocomplete': 'list' as const,
        'aria-expanded': suggestions.length > 0,
        ...restOptions,
        onBlur: compose(handleInputBlur, onBlur),
        onChange: handleInputChange,
        onKeyDown: compose(handleInputKeyDown, onKeyDown),
        value,
      };
    },
    [
      getActiveSuggestionId,
      handleInputBlur,
      handleInputChange,
      handleInputKeyDown,
      ready,
      suggestions.length,
      value,
    ]
  );

  const getSuggestionItemProps = React.useCallback(
    (
      suggestion: Suggestion,
      options: React.HTMLAttributes<HTMLElement> = {}
    ) => {
      const suggestionId = `PlacesAutocomplete__suggestion-${suggestion.placeId}`;
      const {
        onClick = noop,
        onMouseDown = noop,
        onMouseEnter = noop,
        onMouseLeave = noop,
        onMouseUp = noop,
        onTouchEnd = noop,
        onTouchStart = noop,
        ...restOptions
      } = options;

      return {
        ...restOptions,
        id: suggestionId,
        role: 'option' as const,
        onClick: compose((event: React.MouseEvent<HTMLElement>) => {
          event.preventDefault();
          handleSelect(suggestion.description, suggestion.placeId, suggestion);
          window.setTimeout(() => {
            mouseDownOnSuggestionRef.current = false;
          });
        }, onClick),
        onMouseDown: compose((event: React.MouseEvent<HTMLElement>) => {
          event.preventDefault();
          mouseDownOnSuggestionRef.current = true;
        }, onMouseDown),
        onMouseEnter: compose(() => {
          setActiveAtIndex(suggestion.index);
        }, onMouseEnter),
        onMouseLeave: compose(() => {
          mouseDownOnSuggestionRef.current = false;
          clearActive();
        }, onMouseLeave),
        onMouseUp: compose(() => {
          mouseDownOnSuggestionRef.current = false;
        }, onMouseUp),
        onTouchEnd: compose(() => {
          mouseDownOnSuggestionRef.current = false;
        }, onTouchEnd),
        onTouchStart: compose(() => {
          mouseDownOnSuggestionRef.current = true;
        }, onTouchStart),
      };
    },
    [clearActive, handleSelect, setActiveAtIndex]
  );

  return children({
    getInputProps,
    getSuggestionItemProps,
    loading,
    suggestions,
  });
}
