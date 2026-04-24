export function onAuthStateChanged(auth, callback) {
  return auth.onAuthStateChanged(callback);
}

export function signInWithEmailAndPassword(auth, email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

export function createUserWithEmailAndPassword(auth, email, password) {
  return auth.createUserWithEmailAndPassword(email, password);
}

export function signOut(auth) {
  return auth.signOut();
}

export function updateProfile(user, profile) {
  return user.updateProfile(profile);
}
