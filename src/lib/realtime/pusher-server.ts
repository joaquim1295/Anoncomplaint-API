import Pusher from "pusher";

export { privateInboxChannel, privateUserChannel } from "./pusher-channels";

function getPusherServer(): Pusher | null {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY ?? process.env.PUSHER_APP_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER ?? process.env.PUSHER_APP_CLUSTER;
  if (!appId || !key || !secret || !cluster) return null;
  return new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
}

export function getPusherForAuth(): Pusher | null {
  return getPusherServer();
}

export async function triggerRealtimeEvent(
  channel: string,
  eventName: string,
  data: Record<string, unknown>
) {
  const pusher = getPusherServer();
  if (!pusher) return;
  await pusher.trigger(channel, eventName, data);
}
