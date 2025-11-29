
declare module '@joshtwc/react-places-autocomplete' {
  export {
    geocodeByAddress,
    geocodeByPlaceId,
    getLatLng
  } from 'react-places-autocomplete';
  export function geocodeByCoordinates(lat: number, lng: number): Promise<google.maps.GeocoderResult[]>;

  export default function PlacesAutocomplete(props: any): JSX.Element;
}