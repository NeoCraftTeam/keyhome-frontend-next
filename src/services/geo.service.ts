import api from '@/lib/api';

export type OrsProfile =
  | 'foot-walking'
  | 'driving-car'
  | 'cycling-regular'
  | 'wheelchair';

export interface IsochroneResult {
  geojson: GeoJSON.FeatureCollection;
  profile: OrsProfile;
  range_minutes: number;
  center: { lat: number; lng: number };
  cached: boolean;
}

export interface DirectionsSummary {
  distance_m: number;
  duration_s: number;
  distance_label: string;
  duration_label: string;
}

export interface DirectionsResult {
  geojson: GeoJSON.FeatureCollection;
  summary: DirectionsSummary;
  profile: OrsProfile;
  profile_label: string;
  cached: boolean;
}

export const geoService = {
  async getIsochrone(
    lat: number,
    lng: number,
    profile: OrsProfile = 'foot-walking',
    range = 15
  ): Promise<{ data: IsochroneResult }> {
    const { data } = await api.get('/isochrones', {
      params: { lat, lng, profile, range },
    });
    return data;
  },

  async getDirections(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    profile: OrsProfile = 'driving-car'
  ): Promise<{ data: DirectionsResult }> {
    const { data } = await api.get('/directions', {
      params: {
        from_lat: fromLat,
        from_lng: fromLng,
        to_lat: toLat,
        to_lng: toLng,
        profile,
      },
    });
    return data;
  },
};
