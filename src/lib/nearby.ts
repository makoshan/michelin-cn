export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocatableRestaurant {
  id: number;
  name: string;
  city: string;
  latitude: string | number;
  longitude: string | number;
}

export type NearbyRestaurant<T extends LocatableRestaurant> = T & {
  distanceKm: number;
};

export const GUIDE_CITY_CENTERS: Record<string, Coordinates> = {
  "上海": { latitude: 31.2304, longitude: 121.4737 },
  "北京": { latitude: 39.9042, longitude: 116.4074 },
  "广州": { latitude: 23.1291, longitude: 113.2644 },
  "成都": { latitude: 30.5728, longitude: 104.0668 },
  "杭州": { latitude: 30.2741, longitude: 120.1551 },
  "深圳": { latitude: 22.5431, longitude: 114.0579 },
  "香港": { latitude: 22.3193, longitude: 114.1694 },
  "澳门": { latitude: 22.1987, longitude: 113.5491 },
  "台北": { latitude: 25.0330, longitude: 121.5654 },
  "台中": { latitude: 24.1477, longitude: 120.6841 },
  "台南": { latitude: 22.9970, longitude: 120.2097 },
  "高雄": { latitude: 22.6273, longitude: 120.3014 },
  "南京": { latitude: 32.0603, longitude: 118.7969 },
  "苏州": { latitude: 31.2989, longitude: 120.5853 },
  "福州": { latitude: 26.0745, longitude: 119.2965 },
  "厦门": { latitude: 24.4798, longitude: 118.0894 },
  "新北": { latitude: 25.0116, longitude: 121.4657 },
  "新竹市": { latitude: 24.8138, longitude: 120.9675 },
  "新竹县": { latitude: 24.8387, longitude: 121.0177 },
  "温州": { latitude: 27.9938, longitude: 120.6994 },
  "台州": { latitude: 28.6564, longitude: 121.4208 },
  "扬州": { latitude: 32.3942, longitude: 119.4129 },
  "常州": { latitude: 31.8107, longitude: 119.9741 },
  "泉州": { latitude: 24.8741, longitude: 118.6757 },
  "宁德": { latitude: 26.6657, longitude: 119.5482 },
};

export function haversineDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestCity(location: Coordinates) {
  return Object.entries(GUIDE_CITY_CENTERS)
    .map(([name, center]) => ({
      name,
      center,
      distanceKm: haversineDistanceKm(location, center),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0] ?? null;
}

function parseRestaurantCoordinates(restaurant: LocatableRestaurant): Coordinates | null {
  const latitude = typeof restaurant.latitude === "string" ? Number.parseFloat(restaurant.latitude) : restaurant.latitude;
  const longitude = typeof restaurant.longitude === "string" ? Number.parseFloat(restaurant.longitude) : restaurant.longitude;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

export function getNearbyRestaurants<T extends LocatableRestaurant>({
  restaurants,
  userLocation,
  city,
  limit,
}: {
  restaurants: T[];
  userLocation: Coordinates;
  city?: string;
  limit?: number;
}): NearbyRestaurant<T>[] {
  const nearby = restaurants
    .filter((restaurant) => !city || restaurant.city === city)
    .map((restaurant) => {
      const coordinates = parseRestaurantCoordinates(restaurant);
      if (!coordinates) return null;
      return {
        ...restaurant,
        distanceKm: haversineDistanceKm(userLocation, coordinates),
      };
    })
    .filter((restaurant): restaurant is NearbyRestaurant<T> => restaurant !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return typeof limit === "number" ? nearby.slice(0, limit) : nearby;
}
