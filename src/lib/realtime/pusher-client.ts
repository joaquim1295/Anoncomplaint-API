"use client";

import Pusher from "pusher-js";

let client: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY ?? process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER;
  if (!key || !cluster) return null;
  if (client) return client;
  client = new Pusher(key, {
    cluster,
    channelAuthorization: {
      endpoint: "/api/v1/pusher/auth",
      transport: "ajax",
    },
  });
  return client;
}

