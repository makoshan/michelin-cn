import { useState, useEffect } from "react";

export interface StaticRestaurant {
  id: number;
  name: string;
  nameEn: string | null;
  nameZh?: string;
  city: string;
  district: string | null;
  address: string;
  latitude: string;
  longitude: string;
  award: string;
  cuisine: string;
  priceRange: number;
  priceLabel?: string;
  amapPoiId?: string;
  amapLocation?: string;
  baiduUid?: string;
  baiduLocation?: string;
  aiPoiDecision?: "accepted" | "rejected" | "needs_review";
  aiPoiReason?: string;
  phone: string | null;
  website: string | null;
  description: string | null;
  imageUrl: string | null;
  imageUrls?: string[];
  openHours: string | null;
  notes: string | null;
  rating: string | null;
  reviewCount: number | null;
}

let cachedData: StaticRestaurant[] | null = null;
let loadPromise: Promise<StaticRestaurant[]> | null = null;

function loadStaticData(): Promise<StaticRestaurant[]> {
  if (cachedData) return Promise.resolve(cachedData);
  if (loadPromise) return loadPromise;
  
  loadPromise = fetch('/restaurants.json')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load');
      return res.json();
    })
    .then((data: any[]) => {
      const normalized: StaticRestaurant[] = data.map(r => ({
        ...r,
        district: null,
        imageUrl: r.imageUrl ?? null,
        openHours: null,
        notes: null,
        rating: null,
        reviewCount: null,
      }));
      cachedData = normalized;
      return normalized;
    });
  
  return loadPromise;
}

export function useStaticRestaurants() {
  const [data, setData] = useState<StaticRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStaticData()
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading };
}

export function useStaticRestaurantById(id: number) {
  const [data, setData] = useState<StaticRestaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStaticData()
      .then(list => setData(list.find(r => r.id === id) || null))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { data, isLoading };
}

export function useStaticRestaurantsByCity(city: string) {
  const [data, setData] = useState<StaticRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStaticData()
      .then(list => setData(list.filter(r => r.city === city)))
      .catch(() => setData([]))
      .finally(() => setIsLoading(false));
  }, [city]);

  return { data, isLoading };
}

export function useStaticCities() {
  const [cities, setCities] = useState<{ city: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStaticData()
      .then(list => {
        const counts: Record<string, number> = {};
        list.forEach(r => { counts[r.city] = (counts[r.city] || 0) + 1; });
        const sorted = Object.entries(counts)
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count);
        setCities(sorted);
      })
      .catch(() => setCities([]))
      .finally(() => setIsLoading(false));
  }, []);

  return { cities, isLoading };
}

export function useStaticFilteredRestaurants(filters: {
  city?: string;
  award?: string[];
  cuisine?: string[];
  priceRange?: number[];
  search?: string;
}) {
  const [data, setData] = useState<StaticRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStaticData()
      .then(list => {
        let result = list;
        if (filters.city) result = result.filter(r => r.city === filters.city);
        if (filters.award?.length) result = result.filter(r => filters.award!.includes(r.award));
        if (filters.cuisine?.length) result = result.filter(r => filters.cuisine!.includes(r.cuisine));
        if (filters.priceRange?.length) result = result.filter(r => filters.priceRange!.includes(r.priceRange));
        if (filters.search) {
          const q = filters.search.toLowerCase();
          result = result.filter(r => 
            r.name.toLowerCase().includes(q) ||
            r.city.toLowerCase().includes(q) ||
            r.cuisine.toLowerCase().includes(q) ||
            r.address.toLowerCase().includes(q)
          );
        }
        setData(result);
      })
      .catch(() => setData([]))
      .finally(() => setIsLoading(false));
  }, [filters.city, filters.award?.join(','), filters.cuisine?.join(','), filters.priceRange?.join(','), filters.search]);

  return { data, isLoading, total: data.length };
}

export { loadStaticData };
