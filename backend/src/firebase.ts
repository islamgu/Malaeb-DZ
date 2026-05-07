import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Uses GOOGLE_APPLICATION_CREDENTIALS env var if set,
// otherwise initializes with just the project ID
if (!admin.apps.length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    } else {
        admin.initializeApp({
            projectId: 'malaeb-24fdb',
        });
    }
}

export default admin;
