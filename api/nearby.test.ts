import { describe, expect, test } from "vitest";
import {
  findNearestCity,
  getNearbyRestaurants,
  haversineDistanceKm,
  type LocatableRestaurant,
} from "@/lib/nearby";

const restaurants: LocatableRestaurant[] = [
  { id: 1, name: "湖边餐厅", city: "杭州", latitude: "30.2500", longitude: "120.1600" },
  { id: 2, name: "外滩餐厅", city: "上海", latitude: "31.2304", longitude: "121.4737" },
  { id: 3, name: "无坐标餐厅", city: "杭州", latitude: "", longitude: "" },
];

describe("nearby helpers", () => {
  test("calculates realistic distance between nearby coordinates", () => {
    const distance = haversineDistanceKm(
      { latitude: 30.2741, longitude: 120.1551 },
      { latitude: 30.2500, longitude: 120.1600 },
    );

    expect(distance).toBeGreaterThan(2);
    expect(distance).toBeLessThan(3);
  });

  test("finds the closest guide city to a user location", () => {
    const city = findNearestCity({ latitude: 30.2741, longitude: 120.1551 });

    expect(city?.name).toBe("杭州");
    expect(city?.distanceKm).toBeLessThan(1);
  });

  test("returns restaurants in the nearest city ordered by distance", () => {
    const nearby = getNearbyRestaurants({
      restaurants,
      userLocation: { latitude: 30.2741, longitude: 120.1551 },
      city: "杭州",
    });

    expect(nearby).toHaveLength(1);
    expect(nearby[0]?.name).toBe("湖边餐厅");
    expect(nearby[0]?.distanceKm).toBeGreaterThan(2);
    expect(nearby[0]?.distanceKm).toBeLessThan(3);
  });
});
