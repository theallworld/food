import { Capacitor, registerPlugin } from '@capacitor/core';

const SecureStorage = registerPlugin('SecureStorage');
const LEGACY_SETTINGS_KEY = 'deepseek_food_settings';

function isAndroidApp() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function getApiKey() {
  if (isAndroidApp()) {
    const result = await SecureStorage.getApiKey();
    return result.value || '';
  }
  try {
    const saved = localStorage.getItem('food_api_key');
    if (saved) return saved;
    return JSON.parse(localStorage.getItem(LEGACY_SETTINGS_KEY) || '{}').apiKey || '';
  } catch {
    return '';
  }
}

export async function setApiKey(value) {
  if (isAndroidApp()) {
    await SecureStorage.setApiKey({ value: value || '' });
    return;
  }
  try {
    if (value) localStorage.setItem('food_api_key', value);
    else localStorage.removeItem('food_api_key');
  } catch {
    // Saving non-secret settings remains available if browser storage is unavailable.
  }
}

export async function clearApiKey() {
  if (isAndroidApp()) {
    await SecureStorage.clearApiKey();
    return;
  }
  try {
    localStorage.removeItem('food_api_key');
    const settings = JSON.parse(localStorage.getItem(LEGACY_SETTINGS_KEY) || '{}');
    delete settings.apiKey;
    localStorage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Nothing to clear.
  }
}
