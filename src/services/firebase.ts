import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Firebase Auth Helper Functions for MFA

/**
 * Create a new user with email and password
 */
export const createFirebaseUser = async (
    email: string,
    password: string
): Promise<FirebaseAuthTypes.UserCredential> => {
    try {
        const userCredential = await auth().createUserWithEmailAndPassword(email, password);
        return userCredential;
    } catch (error: any) {
        console.error('Error creating user:', error);
        throw error;
    }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
    email: string,
    password: string
): Promise<FirebaseAuthTypes.UserCredential> => {
    try {
        const userCredential = await auth().signInWithEmailAndPassword(email, password);
        return userCredential;
    } catch (error: any) {
        console.error('Error signing in:', error);
        throw error;
    }
};

/**
 * Send email verification to current user
 */
export const sendEmailVerification = async (): Promise<void> => {
    const user = auth().currentUser;
    if (!user) throw new Error('No user logged in');
    await user.sendEmailVerification();
};

/**
 * Check if current user's email is verified
 */
export const isEmailVerified = (): boolean => {
    const user = auth().currentUser;
    return user?.emailVerified || false;
};

/**
 * Reload user to get fresh email verification status
 */
export const reloadUser = async (): Promise<void> => {
    const user = auth().currentUser;
    if (user) {
        await user.reload();
    }
};

/**
 * Get current Firebase user
 */
export const getCurrentUser = (): FirebaseAuthTypes.User | null => {
    return auth().currentUser;
};

/**
 * Send OTP to a phone number for MFA enrollment
 * @param phoneNumber - Phone number in E.164 format (e.g., +213551234567)
 * @returns ConfirmationResult to verify the code later
 */
export const sendPhoneOtp = async (
    phoneNumber: string
): Promise<FirebaseAuthTypes.ConfirmationResult> => {
    try {
        const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
        return confirmation;
    } catch (error: any) {
        console.error('Error sending OTP:', error);
        throw error;
    }
};

/**
 * Verify the OTP code
 * @param confirmationResult - The result from sendPhoneOtp
 * @param otpCode - The 6-digit code entered by user
 * @returns Firebase User Credential
 */
export const verifyPhoneOtp = async (
    confirmationResult: FirebaseAuthTypes.ConfirmationResult,
    otpCode: string
): Promise<FirebaseAuthTypes.UserCredential | null> => {
    try {
        const userCredential = await confirmationResult.confirm(otpCode);
        return userCredential;
    } catch (error: any) {
        console.error('Error verifying OTP:', error);
        throw error;
    }
};

/**
 * Verify phone OTP and get credential (without signing in)
 */
export const verifyPhoneOtpAndGetCredential = async (
    verificationId: string,
    otpCode: string
): Promise<FirebaseAuthTypes.AuthCredential> => {
    const credential = auth.PhoneAuthProvider.credential(verificationId, otpCode);
    return credential;
};

/**
 * Get the current Firebase user's ID token for backend verification
 * @returns ID Token string
 */
export const getFirebaseIdToken = async (): Promise<string | null> => {
    const user = auth().currentUser;
    if (!user) return null;
    return user.getIdToken();
};

/**
 * Sign out from Firebase
 */
export const signOutFirebase = async (): Promise<void> => {
    await auth().signOut();
};

/**
 * Check if user is signed in to Firebase
 */
export const isFirebaseAuthenticated = (): boolean => {
    return !!auth().currentUser;
};

/**
 * Get current Firebase user phone number
 */
export const getFirebasePhoneNumber = (): string | null => {
    return auth().currentUser?.phoneNumber || null;
};

/**
 * Get current Firebase user email
 */
export const getFirebaseEmail = (): string | null => {
    return auth().currentUser?.email || null;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChanged = (
    callback: (user: FirebaseAuthTypes.User | null) => void
): (() => void) => {
    return auth().onAuthStateChanged(callback);
};

// Export auth instance for direct access if needed
export { auth };
