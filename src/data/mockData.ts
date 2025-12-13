// Mock data for the Stadium Manager app

export interface Stadium {
    id: string;
    name: string;
    location: string;
    fullAddress: string;
    rating: number;
    reviewCount: number;
    capacity: number;
    pricePerHour: number;
    isPremium: boolean;
    premiumHourPrice?: number;
    premiumHours?: string[];
    type: 'indoor' | 'outdoor';
    surfaceType: string;
    image: string;
    gallery: string[];
    description: string;
    facilities: string[];
    lat: number;
    lng: number;
}

export interface Booking {
    id: string;
    stadiumId: string;
    stadiumName: string;
    date: string;
    hours: string[];
    totalPrice: number;
    status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
    userId: string;
    userName: string;
    userEmail: string;
    createdAt: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'user' | 'admin';
    avatar?: string;
}

export const mockStadiums: Stadium[] = [
    {
        id: '1',
        name: 'Arena Centrale',
        location: 'Tunis Centre',
        fullAddress: 'Avenue Habib Bourguiba, Tunis 1000',
        rating: 4.8,
        reviewCount: 142,
        capacity: 50,
        pricePerHour: 120,
        isPremium: true,
        premiumHourPrice: 180,
        premiumHours: ['18:00', '19:00', '20:00', '21:00'],
        type: 'indoor',
        surfaceType: 'Synthetic Turf',
        image: 'https://images.unsplash.com/photo-1607667730466-3fe37a1842ac?w=800',
        gallery: [
            'https://images.unsplash.com/photo-1607667730466-3fe37a1842ac?w=800',
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
        ],
        description: 'Modern indoor stadium with state-of-the-art facilities. Perfect for football, basketball, and other sports. Climate-controlled environment ensures optimal playing conditions year-round.',
        facilities: ['Changing Rooms', 'Showers', 'Parking', 'Cafeteria', 'LED Lighting', 'Air Conditioning'],
        lat: 36.8065,
        lng: 10.1815,
    },
    {
        id: '2',
        name: 'Stade El Menzah',
        location: 'El Menzah',
        fullAddress: 'Rue du Stade, El Menzah 2010',
        rating: 4.5,
        reviewCount: 89,
        capacity: 80,
        pricePerHour: 100,
        isPremium: false,
        type: 'outdoor',
        surfaceType: 'Natural Grass',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
        gallery: [
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
        ],
        description: 'Large outdoor stadium with natural grass. Ideal for professional training and matches. Well-maintained field with excellent drainage system.',
        facilities: ['Changing Rooms', 'Showers', 'Parking', 'Seating', 'Floodlights'],
        lat: 36.8389,
        lng: 10.1904,
    },
    {
        id: '3',
        name: 'Court Sportif Premium',
        location: 'Lac 2',
        fullAddress: 'Les Berges du Lac, Tunis 1053',
        rating: 4.9,
        reviewCount: 203,
        capacity: 20,
        pricePerHour: 150,
        isPremium: true,
        premiumHourPrice: 200,
        premiumHours: ['17:00', '18:00', '19:00', '20:00'],
        type: 'indoor',
        surfaceType: 'Hardwood',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
        gallery: [
            'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
        ],
        description: 'Premium basketball and multi-sport court with professional-grade flooring. Perfect for training and competitive matches. Features modern amenities and excellent acoustics.',
        facilities: ['Changing Rooms', 'Showers', 'VIP Lounge', 'Parking', 'Sound System', 'Climate Control'],
        lat: 36.8410,
        lng: 10.2366,
    },
    {
        id: '4',
        name: 'Terrain Municipal',
        location: 'Bardo',
        fullAddress: 'Avenue de la République, Le Bardo 2000',
        rating: 4.2,
        reviewCount: 56,
        capacity: 40,
        pricePerHour: 80,
        isPremium: false,
        type: 'outdoor',
        surfaceType: 'Artificial Turf',
        image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
        gallery: [
            'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
        ],
        description: 'Affordable community stadium with quality artificial turf. Great for casual games and practice sessions. Well-maintained facilities suitable for all ages.',
        facilities: ['Changing Rooms', 'Parking', 'Benches', 'Basic Lighting'],
        lat: 36.8119,
        lng: 10.1406,
    },
    {
        id: '5',
        name: 'Tennis Club Elite',
        location: 'La Marsa',
        fullAddress: 'Avenue Habib Thameur, La Marsa 2078',
        rating: 4.7,
        reviewCount: 118,
        capacity: 12,
        pricePerHour: 110,
        isPremium: true,
        premiumHourPrice: 160,
        premiumHours: ['18:00', '19:00', '20:00'],
        type: 'outdoor',
        surfaceType: 'Clay Court',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        gallery: [
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        ],
        description: 'Professional tennis facility with multiple clay courts. Features coaching services and equipment rental. Popular among competitive players.',
        facilities: ['Pro Shop', 'Changing Rooms', 'Showers', 'Lounge', 'Equipment Rental', 'Coaching Available'],
        lat: 36.8760,
        lng: 10.3248,
    },
];

export const mockBookings: Booking[] = [
    {
        id: 'b1',
        stadiumId: '1',
        stadiumName: 'Arena Centrale',
        date: '2025-12-10',
        hours: ['18:00', '19:00'],
        totalPrice: 360,
        status: 'pending',
        userId: 'u1',
        userName: 'Ahmed Ben Salem',
        userEmail: 'ahmed@example.com',
        createdAt: '2025-12-04T10:30:00',
    },
    {
        id: 'b2',
        stadiumId: '3',
        stadiumName: 'Court Sportif Premium',
        date: '2025-12-08',
        hours: ['14:00', '15:00'],
        totalPrice: 300,
        status: 'accepted',
        userId: 'u1',
        userName: 'Ahmed Ben Salem',
        userEmail: 'ahmed@example.com',
        createdAt: '2025-12-03T15:20:00',
    },
    {
        id: 'b3',
        stadiumId: '2',
        stadiumName: 'Stade El Menzah',
        date: '2025-12-12',
        hours: ['10:00', '11:00', '12:00'],
        totalPrice: 300,
        status: 'pending',
        userId: 'u2',
        userName: 'Sarah Mansouri',
        userEmail: 'sarah@example.com',
        createdAt: '2025-12-04T09:15:00',
    },
    {
        id: 'b4',
        stadiumId: '5',
        stadiumName: 'Tennis Club Elite',
        date: '2025-12-15',
        hours: ['16:00'],
        totalPrice: 110,
        status: 'accepted',
        userId: 'u1',
        userName: 'Ahmed Ben Salem',
        userEmail: 'ahmed@example.com',
        createdAt: '2025-12-01T14:00:00',
    },
];

export const mockUser: User = {
    id: 'u1',
    name: 'Ahmed Ben Salem',
    email: 'ahmed@example.com',
    phone: '+216 98 123 456',
    role: 'user',
};

export const mockAdmin: User = {
    id: 'a1',
    name: 'Admin User',
    email: 'admin@stadiums.com',
    phone: '+216 98 999 999',
    role: 'admin',
};

// Available time slots (9 AM to 10 PM)
export const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

// Reviews data
export interface Review {
    id: string;
    stadiumId: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
}

export const mockReviews: Review[] = [
    {
        id: 'r1',
        stadiumId: '1',
        userName: 'Mohamed Ali',
        rating: 5,
        comment: 'Excellent facilities! The indoor climate control makes it perfect for summer training.',
        date: '2025-11-20',
    },
    {
        id: 'r2',
        stadiumId: '1',
        userName: 'Leila Trabelsi',
        rating: 4,
        comment: 'Great stadium, very clean and well-maintained. Parking could be better.',
        date: '2025-11-18',
    },
    {
        id: 'r3',
        stadiumId: '3',
        userName: 'Karim Jebali',
        rating: 5,
        comment: 'Best basketball court in Tunis! Professional setup and friendly staff.',
        date: '2025-11-15',
    },
];
