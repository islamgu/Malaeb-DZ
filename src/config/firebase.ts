// Firebase configuration
// Note: Firebase is auto-configured from google-services.json (Android) 
// and GoogleService-Info.plist (iOS)

import { firebase } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

// Export the auth module for use throughout the app
export { auth };

// Check if Firebase is initialized
export const isFirebaseInitialized = () => {
    return firebase.apps.length > 0;
};

export default firebase;
