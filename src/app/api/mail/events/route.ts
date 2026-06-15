import { auth } from "@/server/auth";
import {
  encodeMailSseEvent,
  mailRealtimeListenerCount,
  subscribeMailRealtime,
  type MailRealtimeEvent,
} from "@/server/realtime/mail-events";

export const runtime = "nodejs";

const HEARTBEAT_MS = 30_000;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: MailRealtimeEvent) => {
        controller.enqueue(encoder.encode(encodeMailSseEvent(event)));
      };

      send({ type: "connected" });

      const unsubscribe = subscribeMailRealtime(tenantId, send);

      console.info(
        `[mail:realtime] SSE connected tenant ${tenantId} (${mailRealtimeListenerCount(tenantId)} listener(s))` +
          (session.user.email ? ` email=${session.user.email}` : ""),
      );

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, HEARTBEAT_MS);

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
