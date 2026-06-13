const DEVICE_ID_STORAGE_KEY = 'gullycric:deviceId';

export function getOrCreateDeviceId() {
  const existingDeviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const deviceId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
}

export { DEVICE_ID_STORAGE_KEY };
