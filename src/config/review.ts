// Demo / app-store review accounts.
//
// These accounts skip the email-verification gate so that Google Play (and other
// store) reviewers can log in and access the full app without needing access to
// the test account's email inbox.
//
// IMPORTANT: each email listed here must also exist as a real user in Firebase
// Authentication (create it in the Firebase Console with a password, then put the
// same credentials in Play Console → App access).
export const REVIEW_EMAILS: string[] = [
    'demo@malaebdz.com',       // USER role demo account
    'demo-admin@malaebdz.com', // ADMIN role demo account
];

export const isReviewAccount = (email: string): boolean =>
    REVIEW_EMAILS.includes(email.trim().toLowerCase());
