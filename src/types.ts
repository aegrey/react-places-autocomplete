import type * as React from 'react';

export type Suggestion = {
  active: boolean;
  description: string;
  formattedSuggestion: {
    mainText: string;
    secondaryText: string;
  };
  id?: string;
  index: number;
  matchedSubstrings?: Array<{
    length: number;
    offset: number;
  }>;
  placeId: string;
  terms?: Array<{
    offset: number;
    value: string;
  }>;
  types?: string[];
};

export type SearchOptions = Record<string, unknown>;

export type PlacesAutocompleteRenderArgs = {
  getInputProps: (
    options?: React.InputHTMLAttributes<HTMLInputElement>
  ) => React.InputHTMLAttributes<HTMLInputElement> & React.AriaAttributes;
  getSuggestionItemProps: (
    suggestion: Suggestion,
    options?: React.HTMLAttributes<HTMLElement>
  ) => React.HTMLAttributes<HTMLElement> & {
    id: string;
    role: 'option';
  };
  loading: boolean;
  suggestions: Suggestion[];
};

export type PlacesAutocompleteProps = {
  children: (args: PlacesAutocompleteRenderArgs) => React.ReactNode;
  debounce?: number;
  googleCallbackName?: string;
  highlightFirstSuggestion?: boolean;
  onChange: (value: string) => void;
  onError?: (status: unknown, clearSuggestions: () => void) => void;
  onSelect?: (
    address: string,
    placeId: string | null,
    suggestion: Suggestion | null
  ) => void;
  onSuggestions?: (suggestions: Suggestion[]) => void;
  searchOptions?: SearchOptions;
  shouldFetchSuggestions?: boolean;
  value: string;
};
