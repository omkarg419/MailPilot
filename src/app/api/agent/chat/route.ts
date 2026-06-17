import Anthropic from "@anthropic-ai/sdk";

import { AgentAccessDeniedError, assertAgentAccess } from "@/server/agent/access";
import { auth } from "@/server/auth";
import {
  executeOperation,
  type ExecuteOperationInput,
} from "@/server/agent/execute-operation";
import {
  handleUiAgentTool,
  UI_AGENT_TOOLS,
} from "@/server/agent/agent-tools";
import { classifyAgentMessage } from "@/server/agent/guardrails";
import {
  AgentRateLimitError,
  consumeAgentRequest,
} from "@/server/agent/rate-limit";
import {
  buildAgentSystemPrompt,
  EXECUTE_OPERATION_TOOL,
} from "@/server/agent/system-prompt";
import {
  encodeSseEvent,
  toAnthropicMessages,
  type AgentChatRequestBody,
  type AgentStreamEvent,
} from "@/server/agent/types";
import { isPostBookingFollowUpPrompt } from "@/lib/agent-flow";
import { env } from "@/env";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const MAX_TOOL_ROUNDS = 8;

const UI_TOOL_NAMES = new Set(UI_AGENT_TOOLS.map((t) => t.name));

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertAgentAccess(session.user.id, session.user.email);
  } catch (err) {
    if (err instanceof AgentAccessDeniedError) {
      return Response.json(
        { error: err.message, code: "AGENT_ACCESS_DENIED" },
        { status: 403 },
      );
    }
    throw err;
  }

  let body: AgentChatRequestBody;
  try {
    body = (await req.json()) as AgentChatRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.messages?.length) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  const tenantId = session.user.id;
  const lastUserMessage =
    [...body.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const exemptRateLimit = isPostBookingFollowUpPrompt(lastUserMessage);
  const skipGuardrail = exemptRateLimit;

  if (!skipGuardrail) {
    const guard = await classifyAgentMessage(lastUserMessage);
    if (!guard.allowed) {
      return Response.json(
        { error: guard.reason, code: "OFF_TOPIC" },
        { status: 422 },
      );
    }
  }

  if (!exemptRateLimit) {
    try {
      await consumeAgentRequest(tenantId);
    } catch (err) {
      if (err instanceof AgentRateLimitError) {
        return Response.json(
          {
            error: "Agent rate limit reached",
            limit: err.usage.limit,
            used: err.usage.used,
            remaining: err.usage.remaining,
            resetsAt: err.usage.resetsAt?.toISOString() ?? null,
          },
          { status: 429 },
        );
      }
      throw err;
    }
  }

  const system = await buildAgentSystemPrompt(tenantId, body.context);
  const conversation: Anthropic.MessageParam[] = toAnthropicMessages(body.messages);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: AgentStreamEvent) => {
        controller.enqueue(encoder.encode(encodeSseEvent(event)));
      };

      try {
        const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
        let rounds = 0;

        while (rounds < MAX_TOOL_ROUNDS) {
          rounds += 1;

          const anthropicStream = client.messages.stream({
            model: MODEL,
            max_tokens: 4096,
            system,
            messages: conversation,
            tools: [...UI_AGENT_TOOLS, EXECUTE_OPERATION_TOOL],
          });

          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              send({ type: "text", content: event.delta.text });
            }
          }

          const finalMessage = await anthropicStream.finalMessage();

          if (finalMessage.stop_reason !== "tool_use") {
            break;
          }

          const toolUses = finalMessage.content.filter(
            (block): block is Anthropic.ToolUseBlock =>
              block.type === "tool_use",
          );

          conversation.push({ role: "assistant", content: finalMessage.content });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const toolUse of toolUses) {
            send({
              type: "tool_start",
              name: toolUse.name,
              input: toolUse.input,
            });

            let result: unknown;
            if (toolUse.name === "execute_operation") {
              result = await executeOperation(
                tenantId,
                toolUse.input as ExecuteOperationInput,
              );
            } else if (UI_TOOL_NAMES.has(toolUse.name)) {
              result = await handleUiAgentTool(toolUse.name, toolUse.input, send, {
                tenantId,
                timeZone: body.context?.timeZone,
              });
            } else {
              result = { ok: false, error: `Unknown tool: ${toolUse.name}` };
            }

            send({ type: "tool_end", name: toolUse.name, result });

            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: JSON.stringify(result),
            });
          }

          conversation.push({ role: "user", content: toolResults });
        }

        send({ type: "done" });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Agent request failed";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
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
