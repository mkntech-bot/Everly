import { supabase } from "./supabase";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) => char.charCodeAt(0))
  );
}

export async function enablePushNotifications(userId) {
  if (!userId) {
    throw new Error("User is not logged in.");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "This browser does not support service workers."
    );
  }

  if (!("PushManager" in window)) {
    throw new Error(
      "This browser does not support push notifications."
    );
  }

  if (!("Notification" in window)) {
    throw new Error(
      "This browser does not support notifications."
    );
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      "Notification permission was not granted."
    );
  }

  const registration =
    await navigator.serviceWorker.ready;

  let subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    const vapidPublicKey =
      import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      throw new Error(
        "VITE_VAPID_PUBLIC_KEY is missing."
      );
    }

    subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,

        applicationServerKey:
          urlBase64ToUint8Array(
            vapidPublicKey
          ),
      });
  }

  const subscriptionJson =
    subscription.toJSON();

  const endpoint =
    subscriptionJson.endpoint;

  const p256dh =
    subscriptionJson.keys?.p256dh;

  const auth =
    subscriptionJson.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error(
      "The browser returned an invalid push subscription."
    );
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "endpoint",
      }
    );

  if (error) {
    throw error;
  }

  return subscription;
}