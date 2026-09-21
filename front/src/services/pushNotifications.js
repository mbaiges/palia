import { api } from './apiClient';

function applicationServerKey(base64Url) {
  const padding = '='.repeat((4 - base64Url.length % 4) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export async function getPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function syncExistingPushSubscription() {
  const subscription = await getPushSubscription();
  if (subscription) await api.push.subscribe(subscription.toJSON());
}

export async function enablePushNotifications(onPermissionChange = () => {}) {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Este dispositivo o navegador no admite notificaciones push.');
  }
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  onPermissionChange(permission);
  if (permission !== 'granted') throw new Error('El permiso de notificaciones no fue concedido.');
  const { publicKey } = await api.push.vapidPublicKey();
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(publicKey) });
  await api.push.subscribe(subscription.toJSON());
  return subscription;
}

export async function disablePushNotifications({ bestEffort = false } = {}) {
  const subscription = await getPushSubscription();
  if (!subscription) return;
  try { await api.push.unsubscribe(subscription.endpoint); }
  catch (error) { if (!bestEffort) throw error; }
  await subscription.unsubscribe();
}
