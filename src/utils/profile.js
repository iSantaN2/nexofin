export function getUserAlias(user, userProfile) {
  const alias =
    userProfile?.alias?.trim() ||
    userProfile?.displayName?.trim() ||
    user?.displayName?.trim() ||
    "";

  if (alias) return alias;

  const email = user?.email?.trim() || "";
  if (email.includes("@")) return email.split("@")[0];

  return "Tu cuenta";
}

export function getUserPhotoUrl(user, userProfile) {
  return userProfile?.photoURL?.trim() || user?.photoURL?.trim() || "";
}

export function getUserInitial(user, userProfile) {
  return getUserAlias(user, userProfile).charAt(0).toUpperCase() || "N";
}
