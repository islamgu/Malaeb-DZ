import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your computer's local IP for device testing
// Android emulator: use 10.0.2.2, Android physical device: use your computer's IP
// iOS simulator: can use localhost, iOS physical device: use your computer's IP
const API_URL = 'https://malaeb-dz.onrender.com/api';
export const BASE_URL = 'https://malaeb-dz.onrender.com';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ============ Auth ============

export const authApi = {
    login: async (email: string, password: string) => {
        const { data } = await api.post('/auth/login', { email, password });
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        return data;
    },

    register: async (email: string, password: string, phone?: string, name?: string) => {
        const { data } = await api.post('/auth/register', { email, password, phone, name });
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        return data;
    },

    verifyEmail: async () => {
        const { data } = await api.patch('/auth/verify-email');
        // Update stored user
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            user.emailVerified = true;
            await AsyncStorage.setItem('user', JSON.stringify(user));
        }
        return data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    },

    getMe: async () => {
        const { data } = await api.get('/auth/me');
        return data;
    },

    getStoredUser: async () => {
        const user = await AsyncStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    getToken: async () => {
        return AsyncStorage.getItem('token');
    },
};

// ============ Stadiums ============

export interface Stadium {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    city: string | null;
    lat: number | null;
    lng: number | null;
    capacity: number | null;
    surface: string | null;
    type: 'indoor' | 'outdoor' | null;
    pricePerHour: number;
    premiumMultiplier: number;
    isPremium: boolean;
    facilities: string[] | null;
    image: string;
    images: string[];
}

export const stadiumsApi = {
    getAll: async (): Promise<Stadium[]> => {
        const { data } = await api.get('/stadiums');
        return data;
    },

    getById: async (id: string): Promise<Stadium> => {
        const { data } = await api.get(`/stadiums/${id}`);
        return data;
    },

    create: async (stadium: Partial<Stadium>) => {
        const { data } = await api.post('/stadiums', stadium);
        return data;
    },

    update: async (id: string, stadium: Partial<Stadium>) => {
        const { data } = await api.put(`/stadiums/${id}`, stadium);
        return data;
    },

    delete: async (id: string) => {
        const { data } = await api.delete(`/stadiums/${id}`);
        return data;
    },

    uploadImages: async (stadiumId: string, images: { uri: string; type: string; name: string }[]) => {
        const formData = new FormData();
        images.forEach((image) => {
            formData.append('images', image as any);
        });
        const { data } = await api.post(`/upload/stadium/${stadiumId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
};

// ============ Bookings ============

export interface Booking {
    id: string;
    stadiumId: string;
    stadiumName: string | null;
    stadiumAddress: string | null;
    startAt: string;
    endAt: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
    price: number;
    isPremium: boolean;
    createdAt: string;
    userName?: string;
    userEmail?: string;
}

export const bookingsApi = {
    getMyBookings: async (): Promise<Booking[]> => {
        const { data } = await api.get('/bookings');
        return data;
    },

    getAllBookings: async (): Promise<Booking[]> => {
        const { data } = await api.get('/bookings/all');
        return data;
    },

    create: async (booking: {
        stadiumId: string;
        startAt: string;
        endAt: string;
        price: number;
        isPremium?: boolean;
    }) => {
        const { data } = await api.post('/bookings', booking);
        return data;
    },

    updateStatus: async (id: string, status: Booking['status']) => {
        const { data } = await api.patch(`/bookings/${id}/status`, { status });
        return data;
    },

    cancel: async (id: string) => {
        const { data } = await api.delete(`/bookings/${id}`);
        return data;
    },
};

// ============ Favorites ============

export interface Favorite {
    id: string;
    stadiumId: string;
    stadiumName: string;
    stadiumCity: string | null;
    stadiumAddress: string | null;
    stadiumPricePerHour: number;
    stadiumIsPremium: boolean;
    stadiumType: 'indoor' | 'outdoor' | null;
    stadiumCapacity: number | null;
    image: string;
}

export const favoritesApi = {
    getAll: async (): Promise<Favorite[]> => {
        const { data } = await api.get('/favorites');
        return data;
    },

    add: async (stadiumId: string) => {
        const { data } = await api.post('/favorites', { stadiumId });
        return data;
    },

    remove: async (stadiumId: string) => {
        const { data } = await api.delete(`/favorites/${stadiumId}`);
        return data;
    },

    check: async (stadiumId: string): Promise<boolean> => {
        const { data } = await api.get(`/favorites/check/${stadiumId}`);
        return data.isFavorite;
    },
};

// ============ Reviews ============

export interface Review {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    userName: string | null;
    userEmail: string | null;
}

export interface ReviewsResponse {
    reviews: Review[];
    averageRating: number | null;
    totalReviews: number;
}

export const reviewsApi = {
    getByStadium: async (stadiumId: string): Promise<ReviewsResponse> => {
        const { data } = await api.get(`/reviews/${stadiumId}`);
        return data;
    },

    add: async (stadiumId: string, rating: number, comment?: string) => {
        const { data } = await api.post('/reviews', { stadiumId, rating, comment });
        return data;
    },

    delete: async (id: string) => {
        const { data } = await api.delete(`/reviews/${id}`);
        return data;
    },
};

export default api;
