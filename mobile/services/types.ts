export type UserRole = 'driver' | 'mechanic';

export interface UserProfile {
  role: UserRole;
}

export interface ProviderProfile {
  id: number;
  name: string;
  area: string;
  service_mode: 'mobile' | 'garage';
  is_available: boolean;
  is_verified: boolean;
}

export interface User {
  id: number;
  email: string;
  name: string;
  profile: UserProfile;
  provider_profile?: ProviderProfile | null;
}

export interface Mechanic {
  id: number;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  service_mode: 'mobile' | 'garage';
  phone?: string;
  rating: number;
  review_count: number;
  eta?: string;
  is_available: boolean;
  services: string[];
  distance_km?: number;
  is_verified?: boolean;
}

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface AssistanceRequest {
  id: number;
  mechanic: number;
  mechanic_details?: {
    id: number;
    name: string;
    phone?: string;
    area: string;
    service_mode: string;
    latitude: number;
    longitude: number;
  };
  driver?: number;
  driver_name?: string;
  driver_email?: string;
  issue: string;
  notes?: string;
  latitude: number;
  longitude: number;
  service_mode: 'mobile' | 'garage';
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  review?: Review | null;
}

export interface RequestMessage {
  id: number;
  request: number;
  sender: number;
  sender_name?: string;
  message: string;
  created_at: string;
}

export interface Review {
  id?: number;
  rating: number;
  comment: string;
  driver_name?: string;
  created_at?: string;
}

export interface LocationOption {
  name: string;
  latitude: number;
  longitude: number;
}
