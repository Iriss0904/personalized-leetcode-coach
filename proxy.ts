import { NextResponse, type NextRequest } from "next/server";

import { WEBUI_LOCAL_URL, WEBUI_PORT_STRING } from "./src/lib/webui-port";

function getHostPort(host: string): string | null {
  const normalizedHost = host.trim();
  if (!normalizedHost) {
    return null;
  }

  if (normalizedHost.startsWith("[")) {
    return normalizedHost.match(/\]:(\d+)$/)?.[1] ?? null;
  }

  const separatorIndex = normalizedHost.lastIndexOf(":");
  if (separatorIndex === -1) {
    return null;
  }

  return normalizedHost.slice(separatorIndex + 1);
}

function getHostname(host: string): string {
  const normalized = host.trim().toLowerCase();
  if (normalized.startsWith("[")) return normalized.slice(1, normalized.indexOf("]"));
  const separatorIndex = normalized.lastIndexOf(":");
  return separatorIndex === -1 ? normalized : normalized.slice(0, separatorIndex);
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const port = getHostPort(host);
  const hostname = getHostname(host);

  if (port !== WEBUI_PORT_STRING || !["localhost", "127.0.0.1", "::1"].includes(hostname)) {
    return new NextResponse(
      `PatternCoach WebUI only serves ${WEBUI_LOCAL_URL}. Stop this server and restart with npm run dev.`,
      {
        headers: {
          "content-type": "text/plain; charset=utf-8",
        },
        status: 421,
      },
    );
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const fetchSite = request.headers.get("sec-fetch-site");
    const origin = request.headers.get("origin");
    if (fetchSite === "cross-site" || (origin && !isAllowedOrigin(origin))) {
      return new NextResponse("Cross-site writes to the local PatternCoach instance are not allowed.", {
        headers: { "content-type": "text/plain; charset=utf-8" },
        status: 403,
      });
    }
  }

  return NextResponse.next();
}

function isAllowedOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname) && url.port === WEBUI_PORT_STRING;
  } catch {
    return false;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
