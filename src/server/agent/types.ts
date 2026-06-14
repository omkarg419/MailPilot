import type Anthropic from "@anthropic-ai/sdk";

import type { ClientChatMessage } from "@/types/agent-chat";

export type { AgentChatContext, AgentChatRequestBody, AgentStreamEvent, ClientChatMessage } from "@/types/agent-chat";
export { encodeSseEvent } from "@/types/agent-chat";

export function toAnthropicMessages(
  messages: ClientChatMessage[],
): Anthropic.MessageParam[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}
