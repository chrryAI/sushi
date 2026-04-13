/**
 * Firebase stub for browser extension
 * Extensions use Better Auth, not Firebase - this prevents bundling Firebase dependencies
 */

export const initializeApp = () => ({})
export const getAuth = () => ({})
export const signInWithPopup = async () => {
  throw new Error("Firebase not available in extension")
}
export const signOut = async () => {
  throw new Error("Firebase not available in extension")
}

export default {}
