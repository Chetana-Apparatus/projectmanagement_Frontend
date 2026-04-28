import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function getBackendOrigin(): string {
  const raw =
    process.env.BACKEND_API_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    "http://127.0.0.1:8000";
  return raw.replace(/\/+$/, "");
}

/** Forward only headers Django needs; avoid hop-by-hop / invalid proxy headers. */
function pickHeaders(from: NextRequest["headers"]): Headers {
  const h = new Headers();
  const copy = [
    "authorization",
    "content-type",
    "accept",
    "accept-language",
    "cookie",
  ] as const;
  for (const name of copy) {
    const v = from.get(name);
    if (v) h.set(name, v);
  }
  return h;
}

/** DRF `DefaultRouter` list/detail URLs end with `/`; Django's `APPEND_SLASH` cannot redirect POST preserving body if we omit it. */
const DRF_ROUTER_ROOTS = new Set([
  "users",
  "projects",
  "milestones",
  "tasks",
  "files",
  "notifications",
]);

function upstreamApiPath(rest: string): string {
  const base = getBackendOrigin();
  if (!rest) return `${base}/api/v1/`;
  const first = rest.split("/")[0];
  const tail = `/api/v1/${rest}`;
  const needsTrailingSlash = DRF_ROUTER_ROOTS.has(first) && !tail.endsWith("/");
  return `${base}${needsTrailingSlash ? `${tail}/` : tail}`;
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path: segments } = await context.params;
  const rest = segments?.length ? segments.join("/") : "";
  const url = new URL(request.url);
  const upstream = `${upstreamApiPath(rest)}${url.search}`;

  try {
    const hasBody = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    const upstreamRes = await fetch(upstream, {
      method: request.method,
      headers: pickHeaders(request.headers),
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: upstreamRes.headers,
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    const origin = getBackendOrigin();
    return Response.json(
      {
        success: false,
        message: `Cannot reach Django at ${origin} (${detail}). Use BACKEND_API_ORIGIN in .env if the API is not on this host (e.g. WSL or Docker).`,
        code: 502,
        data: null,
      },
      { status: 502 },
    );
  }
}

export function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}

export function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}

export function PUT(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}

export function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}

export function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}

export function OPTIONS(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context);
}
