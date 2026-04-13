/**
 * Capacitor stub for browser extension
 * Extensions don't use Capacitor - this prevents bundling Capacitor dependencies
 */

export const FirebaseAuthentication = {
  signInWithGoogle: async () => {
    throw new Error("Capacitor auth not available in extension")
  },
  signInWithApple: async () => {
    throw new Error("Capacitor auth not available in extension")
  },
  signOut: async () => {
    throw new Error("Capacitor auth not available in extension")
  },
  getCurrentUser: async () => {
    throw new Error("Capacitor auth not available in extension")
  },
}

export const GoogleAuth = {
  initialize: async () => {},
  signIn: async () => {
    throw new Error("Capacitor auth not available in extension")
  },
  signOut: async () => {
    throw new Error("Capacitor auth not available in extension")
  },
}

export default {}
