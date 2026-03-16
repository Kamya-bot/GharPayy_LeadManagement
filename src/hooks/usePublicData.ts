import { useQuery, useMutation } from '@tanstack/react-query';

export interface PropertyFilters {
  city?: string;
  area?: string;
  budgetMin?: number;
  budgetMax?: number;
  roomType?: string;
  gender?: string;
  amenity?: string;
  sharingTypes?: string[];
  nearLandmark?: string;
  page?: number;
  limit?: number;
}

export function usePublicProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ['public-properties', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.area) params.append('area', filters.area);
      if (filters.gender) params.append('gender', filters.gender);
      
      const res = await fetch(`/api/public/properties?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch properties');
      const data = await res.json();

      // Client-side filtering for budget and sharing type if needed
      let results = data || [];
      if (filters.budgetMax) {
        results = results.filter((p: any) => {
          const rents = (p.rooms || []).map((r: any) => r.rentPerBed || r.expectedRent).filter(Boolean);
          if (!rents.length) return true;
          return Math.min(...rents) <= filters.budgetMax!;
        });
      }
      return results;
    },
  });
}

export function usePublicProperty(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['public-property', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const res = await fetch(`/api/public/properties/${propertyId}`);
      if (!res.ok) throw new Error('Failed to fetch property');
      return res.json();
    },
  });
}

export function useSimilarProperties(area?: string | null, city?: string | null, excludeId?: string) {
  return useQuery({
    queryKey: ['similar-properties', area, city, excludeId],
    enabled: !!(area || city),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (area) params.append('area', area);
      if (city) params.append('city', city);
      
      const res = await fetch(`/api/public/properties?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch similar properties');
      const data = await res.json();
      return data.filter((p: any) => p.id !== excludeId).slice(0, 6);
    },
  });
}

export function useAvailableCities() {
  return useQuery({
    queryKey: ['available-cities'],
    queryFn: async () => {
      const res = await fetch('/api/public/cities');
      if (!res.ok) throw new Error('Failed to fetch cities');
      return res.json();
    },
  });
}

export function useAvailableAreas(city?: string) {
  return useQuery({
    queryKey: ['available-areas', city],
    queryFn: async () => {
      const url = city ? `/api/public/areas?city=${city}` : '/api/public/areas';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch areas');
      return res.json();
    },
  });
}

export function useLandmarks(city?: string) {
  return useQuery({
    queryKey: ['landmarks', city],
    queryFn: async () => {
      const url = city ? `/api/public/landmarks?city=${city}` : '/api/public/landmarks';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch landmarks');
      return res.json();
    },
  });
}

export function useCreateReservation() {
  return useMutation({
    mutationFn: async (params: any) => {
      // API not yet implemented - using stub
      console.log('Creating reservation', params);
      return { reservation_id: 'mock-res-' + Date.now() };
    },
  });
}

export function useConfirmReservation() {
  return useMutation({
    mutationFn: async (params: any) => {
      // API not yet implemented - using stub
      console.log('Confirming reservation', params);
      return { success: true };
    },
  });
}


