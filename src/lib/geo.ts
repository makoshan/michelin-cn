export type NavProvider = "amap" | "baidu";

const MAINLAND_CITIES = new Set([
  "北京",
  "上海",
  "广州",
  "成都",
  "杭州",
  "深圳",
  "南京",
  "苏州",
  "福州",
  "厦门",
  "温州",
  "台州",
  "扬州",
  "常州",
  "泉州",
  "宁德",
]);

interface NavigationRestaurant {
  name: string;
  nameEn?: string | null;
  city: string;
  address: string;
  latitude: string | number;
  longitude: string | number;
  amapLocation?: string | null;
}

const PI = Math.PI;
const AXIS = 6378245.0;
const OFFSET = 0.00669342162296594323;

export function isMainlandCity(city: string) {
  return MAINLAND_CITIES.has(city);
}

function transformLat(x: number, y: number) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLng(x: number, y: number) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0;
  return ret;
}

export function wgs84ToGcj02(lat: number, lng: number): [number, number] {
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - OFFSET * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((AXIS * (1 - OFFSET)) / (magic * sqrtMagic)) * PI);
  dLng = (dLng * 180.0) / ((AXIS / sqrtMagic) * Math.cos(radLat) * PI);
  return [lat + dLat, lng + dLng];
}

export function gcj02ToBd09(lat: number, lng: number): [number, number] {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * PI * 3000.0 / 180.0);
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * PI * 3000.0 / 180.0);
  return [z * Math.sin(theta) + 0.006, z * Math.cos(theta) + 0.0065];
}

export function getAmapMarkerPosition(city: string, lat: number, lng: number): [number, number] {
  return isMainlandCity(city) ? wgs84ToGcj02(lat, lng) : [lat, lng];
}

export function buildNavigationUrl(provider: NavProvider, restaurant: NavigationRestaurant) {
  const lat = typeof restaurant.latitude === "string" ? parseFloat(restaurant.latitude) : restaurant.latitude;
  const lng = typeof restaurant.longitude === "string" ? parseFloat(restaurant.longitude) : restaurant.longitude;
  const [amapLng, amapLat] = (restaurant.amapLocation || "")
    .split(",")
    .map((value) => Number(value));
  const label = restaurant.nameEn && restaurant.nameEn !== restaurant.name
    ? `${restaurant.name} ${restaurant.nameEn}`
    : restaurant.name;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const query = encodeURIComponent(`${restaurant.city}${restaurant.address}`);
    return provider === "amap"
      ? `https://uri.amap.com/search?keyword=${query}`
      : `https://map.baidu.com/search/${query}`;
  }

  if (provider === "amap") {
    if (Number.isFinite(amapLat) && Number.isFinite(amapLng)) {
      return `https://uri.amap.com/navigation?to=${amapLng},${amapLat},${encodeURIComponent(label)}&mode=car&policy=1&src=michelin-guide&coordinate=gaode&callnative=1`;
    }
    return `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(label)}&mode=car&policy=1&src=michelin-guide&coordinate=wgs84&callnative=1`;
  }

  if (!isMainlandCity(restaurant.city)) {
    const query = encodeURIComponent(`${label} ${restaurant.city}${restaurant.address}`);
    return `https://map.baidu.com/search/${query}`;
  }

  const [gcjLat, gcjLng] = Number.isFinite(amapLat) && Number.isFinite(amapLng)
    ? [amapLat, amapLng]
    : wgs84ToGcj02(lat, lng);
  const [bdLat, bdLng] = gcj02ToBd09(gcjLat, gcjLng);
  const destination = encodeURIComponent(`latlng:${bdLat},${bdLng}|name:${label}`);
  return `https://api.map.baidu.com/direction?destination=${destination}&mode=driving&region=${encodeURIComponent(restaurant.city)}&output=html&src=michelin-guide`;
}
