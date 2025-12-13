import 'dotenv/config';
import { db } from './db';
import { users, stadiums, stadiumImages, availabilityRules } from './db/schema';

// Algerian stadium data
const algerianStadiums = [
    {
        name: 'Stade 5 Juillet 1962',
        description: 'The largest stadium in Algeria, home to the national football team. Modern facilities with excellent lighting and premium seating areas.',
        address: 'Route de l\'Aéroport, Chéraga',
        city: 'Algiers',
        lat: 36.7538,
        lng: 3.0588,
        capacity: 85,
        surface: 'Natural Grass',
        type: 'outdoor' as const,
        pricePerHour: 15000,
        premiumMultiplier: 1.5,
        isPremium: true,
        facilities: ['Changing Rooms', 'Showers', 'VIP Lounge', 'Parking', 'Floodlights', 'Medical Room'],
        images: [
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
            'https://images.unsplash.com/photo-1607667730466-3fe37a1842ac?w=800',
        ],
    },
    {
        name: 'Stade Ahmed Zabana',
        description: 'Historic stadium in Oran with great atmosphere. Well-maintained pitch perfect for training and matches.',
        address: 'Boulevard Zabana, Es Seddikia',
        city: 'Oran',
        lat: 35.6987,
        lng: -0.6349,
        capacity: 40,
        surface: 'Synthetic Turf',
        type: 'outdoor' as const,
        pricePerHour: 8000,
        premiumMultiplier: 1.3,
        isPremium: false,
        facilities: ['Changing Rooms', 'Showers', 'Parking', 'Benches', 'Floodlights'],
        images: [
            'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
        ],
    },
    {
        name: 'Stade Mohamed Hamlaoui',
        description: 'Modern stadium in Constantine with excellent facilities. Indoor and outdoor facilities available.',
        address: 'Nouvelle Ville Ali Mendjeli',
        city: 'Constantine',
        lat: 36.3650,
        lng: 6.6147,
        capacity: 50,
        surface: 'Synthetic Turf',
        type: 'outdoor' as const,
        pricePerHour: 10000,
        premiumMultiplier: 1.4,
        isPremium: true,
        facilities: ['Changing Rooms', 'Showers', 'Cafeteria', 'Parking', 'Floodlights', 'Gym'],
        images: [
            'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
        ],
    },
    {
        name: 'Stade Mustapha Tchaker',
        description: 'Multi-purpose stadium in Blida with quality facilities. Ideal for football training and local matches.',
        address: 'Boulevard des Martyrs',
        city: 'Blida',
        lat: 36.4722,
        lng: 2.8344,
        capacity: 35,
        surface: 'Natural Grass',
        type: 'outdoor' as const,
        pricePerHour: 7000,
        premiumMultiplier: 1.2,
        isPremium: false,
        facilities: ['Changing Rooms', 'Showers', 'Parking', 'Floodlights'],
        images: [
            'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800',
        ],
    },
    {
        name: 'Complexe Sportif OCO',
        description: 'Brand new sports complex in Oran. State-of-the-art indoor facilities perfect for all weather conditions.',
        address: 'Bir El Djir',
        city: 'Oran',
        lat: 35.7275,
        lng: -0.5506,
        capacity: 25,
        surface: 'Hardwood',
        type: 'indoor' as const,
        pricePerHour: 12000,
        premiumMultiplier: 1.5,
        isPremium: true,
        facilities: ['Changing Rooms', 'Showers', 'VIP Lounge', 'Parking', 'Air Conditioning', 'Sound System', 'Gym'],
        images: [
            'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
        ],
    },
];

// Availability rules - standard hours for each day
const defaultAvailability = [
    { weekday: 0, startTime: '09:00', endTime: '22:00', isPremium: false }, // Sunday
    { weekday: 1, startTime: '08:00', endTime: '22:00', isPremium: false }, // Monday
    { weekday: 2, startTime: '08:00', endTime: '22:00', isPremium: false }, // Tuesday
    { weekday: 3, startTime: '08:00', endTime: '22:00', isPremium: false }, // Wednesday
    { weekday: 4, startTime: '08:00', endTime: '22:00', isPremium: false }, // Thursday
    { weekday: 5, startTime: '08:00', endTime: '23:00', isPremium: true }, // Friday (premium)
    { weekday: 6, startTime: '09:00', endTime: '23:00', isPremium: true }, // Saturday (premium)
];

async function seed() {
    console.log('🌱 Seeding database...\n');

    try {
        // Create admin user
        console.log('👤 Creating admin user...');
        const [admin] = await db.insert(users).values({
            email: 'admin@gmail.com',
            name: 'Admin',
            phone: '1234', // Password stored here for demo
            role: 'ADMIN',
        }).onConflictDoNothing().returning();

        if (admin) {
            console.log(`   ✅ Admin created: ${admin.email}`);
        } else {
            console.log('   ⚠️  Admin already exists');
        }

        // Create test user
        const [testUser] = await db.insert(users).values({
            email: 'user@example.com',
            name: 'Test User',
            phone: '$2a$10$abcdefghijklmnopqrstuvwxyz123456', // Hashed 'password'
            role: 'USER',
        }).onConflictDoNothing().returning();

        if (testUser) {
            console.log(`   ✅ Test user created: ${testUser.email}`);
        }

        // Create stadiums
        console.log('\n🏟️  Creating Algerian stadiums...');
        for (const stadiumData of algerianStadiums) {
            const { images, ...stadium } = stadiumData;

            const [newStadium] = await db.insert(stadiums).values(stadium).returning();
            console.log(`   ✅ ${newStadium.name} (${stadium.city})`);

            // Add images
            if (images.length > 0) {
                await db.insert(stadiumImages).values(
                    images.map((url, index) => ({
                        stadiumId: newStadium.id,
                        url,
                        order: index,
                    }))
                );
            }

            // Add availability rules
            await db.insert(availabilityRules).values(
                defaultAvailability.map(rule => ({
                    stadiumId: newStadium.id,
                    ...rule,
                }))
            );
        }

        console.log('\n✨ Seed completed successfully!');
        console.log('\n📋 Login credentials:');
        console.log('   Admin: admin@gmail.com / 1234');
        console.log('   User:  user@example.com / password');

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

seed();
