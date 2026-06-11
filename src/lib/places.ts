import 'server-only';

/**
 * Business discovery via the Google Places API (New). We use the official API
 * instead of scraping HTML: it's reliable, legal, and tells us directly whether
 * a business has a website (`websiteUri` missing = prospect).
 *
 * Requires GOOGLE_PLACES_API_KEY (Google Cloud → Places API (New) enabled).
 * Without it, the prospecting UI falls back to manual entry.
 */

export interface PlaceResult {
  place_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
}

export function placesConfigured() {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY);
}

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
].join(',');

export async function searchPlaces(textQuery: string): Promise<PlaceResult[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY no configurada');

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({ textQuery, languageCode: 'es', regionCode: 'ES', pageSize: 20 }),
    cache: 'no-store',
  });

  const data = (await res.json()) as {
    places?: {
      id: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      nationalPhoneNumber?: string;
      internationalPhoneNumber?: string;
      websiteUri?: string;
      rating?: number;
      userRatingCount?: number;
    }[];
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(data.error?.message || `Places API ${res.status}`);

  return (data.places ?? []).map((p) => ({
    place_id: p.id,
    name: p.displayName?.text ?? 'Negocio sin nombre',
    address: p.formattedAddress ?? null,
    phone: p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    rating: p.rating ?? null,
    reviews_count: p.userRatingCount ?? null,
  }));
}
