const ACCOUNT_DELETION_STORAGE_KEY = "nexofin_account_deletion_in_progress";

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function markAccountDeletionInProgress(uid) {
  const storage = getStorage();
  if (!storage || !uid) return;
  storage.setItem(ACCOUNT_DELETION_STORAGE_KEY, uid);
}

export function clearAccountDeletionInProgress(uid = null) {
  const storage = getStorage();
  if (!storage) return;

  if (!uid) {
    storage.removeItem(ACCOUNT_DELETION_STORAGE_KEY);
    return;
  }

  const currentValue = storage.getItem(ACCOUNT_DELETION_STORAGE_KEY);
  if (currentValue === uid) {
    storage.removeItem(ACCOUNT_DELETION_STORAGE_KEY);
  }
}

export function isAccountDeletionInProgress(uid) {
  const storage = getStorage();
  if (!storage || !uid) return false;
  return storage.getItem(ACCOUNT_DELETION_STORAGE_KEY) === uid;
}
