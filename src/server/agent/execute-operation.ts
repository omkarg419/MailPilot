import "server-only";

import { getSchema, listOperations } from "corsair";

import { corsair, getConnectionFlags } from "@/server/corsair";

export type AgentPlugin = "gmail" | "googlecalendar";

export type ExecuteOperationInput = {
  plugin: AgentPlugin;
  /** e.g. `api.threads.list` or full `gmail.api.threads.list` */
  operation: string;
  params?: Record<string, unknown>;
};

export type ExecuteOperationResult =
  | { ok: true; operation: string; result: unknown }
  | { ok: false; operation: string; error: string };

const PLUGIN_CONNECTION: Record<
  AgentPlugin,
  keyof Awaited<ReturnType<typeof getConnectionFlags>>
> = {
  gmail: "gmail",
  googlecalendar: "calendar",
};

function parseOperationsList(raw: ReturnType<typeof listOperations>): string[] {
  const text = typeof raw === "string" ? raw : String(raw);
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

type CorsairTenant = ReturnType<typeof corsair.withTenant>;
type CorsairInstance = Parameters<typeof listOperations>[0];

function asCorsairInstance(tenant: CorsairTenant): CorsairInstance {
  return tenant as unknown as CorsairInstance;
}

export function listAvailableOperations(tenantId: string, plugin?: AgentPlugin): string[] {
  const tenant = corsair.withTenant(tenantId);
  const ops = parseOperationsList(listOperations(asCorsairInstance(tenant)));
  if (!plugin) return ops;
  const prefix = `${plugin}.`;
  return ops.filter((op) => op.startsWith(prefix));
}

function normalizeOperation(plugin: AgentPlugin, operation: string): string {
  const trimmed = operation.trim();
  if (trimmed.startsWith(`${plugin}.`)) return trimmed;
  const path = trimmed.startsWith("api.") || trimmed.startsWith("db.")
    ? trimmed
    : `api.${trimmed}`;
  return `${plugin}.${path}`;
}

function getOperationCallable(
  tenant: ReturnType<typeof corsair.withTenant>,
  fullOperation: string,
): ((params: Record<string, unknown>) => Promise<unknown>) | null {
  const parts = fullOperation.split(".");
  if (parts.length < 3) return null;

  const pluginId = parts[0]!;
  const plugin = tenant[pluginId as "gmail" | "googlecalendar"];
  if (!plugin || typeof plugin !== "object") return null;

  let current: unknown = plugin;
  for (const segment of parts.slice(1)) {
    if (!current || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[segment];
  }

  if (typeof current !== "function") return null;

  let parent: unknown = plugin;
  for (const segment of parts.slice(1, -1)) {
    parent = (parent as Record<string, unknown>)[segment];
  }

  return (current as (...args: unknown[]) => Promise<unknown>).bind(parent);
}

export async function executeOperation(
  tenantId: string,
  input: ExecuteOperationInput,
): Promise<ExecuteOperationResult> {
  const fullOperation = normalizeOperation(input.plugin, input.operation);
  const params = input.params ?? {};

  const connections = await getConnectionFlags(tenantId);
  const connectionKey = PLUGIN_CONNECTION[input.plugin];
  if (!connections[connectionKey]) {
    return {
      ok: false,
      operation: fullOperation,
      error: `${input.plugin} is not connected. Ask the user to connect at /connect.`,
    };
  }

  const tenant = corsair.withTenant(tenantId);
  const corsairInstance = asCorsairInstance(tenant);
  const allowed = parseOperationsList(listOperations(corsairInstance));
  if (!allowed.includes(fullOperation)) {
    const similar = allowed
      .filter((op) => op.startsWith(`${input.plugin}.`))
      .slice(0, 12);
    return {
      ok: false,
      operation: fullOperation,
      error: `Unknown operation "${fullOperation}". Use list_operations or pick from: ${similar.join(", ")}`,
    };
  }

  // Surface schema docs to help debugging when params are wrong.
  let schemaHint = "";
  try {
    const schema = getSchema(corsairInstance, fullOperation);
    if (typeof schema === "string") schemaHint = schema.slice(0, 500);
  } catch {
    // Non-fatal — execution may still succeed.
  }

  const fn = getOperationCallable(tenant, fullOperation);
  if (!fn) {
    return {
      ok: false,
      operation: fullOperation,
      error: `Could not resolve callable for "${fullOperation}".`,
    };
  }

  try {
    const result = await fn(params);
    return { ok: true, operation: fullOperation, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      operation: fullOperation,
      error: schemaHint
        ? `${message}\n\nSchema hint:\n${schemaHint}`
        : message,
    };
  }
}
