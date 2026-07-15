import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import net from "node:net";

import {
  WEBUI_LOCAL_URL,
  WEBUI_PORT,
  WEBUI_PORT_STRING,
} from "../src/lib/webui-port";

const DEFAULT_HOSTNAME = "127.0.0.1";
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const NON_BROWSABLE_HOST_URL = `http://0.0.0.0:${WEBUI_PORT_STRING}`;

type ParsedDevArgs = {
  hostname: string;
  passthroughArgs: string[];
  requestedPorts: string[];
};

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) {
    fail(`Missing value for ${flag}. PatternCoach WebUI must run on ${WEBUI_LOCAL_URL}.`);
  }
  return value;
}

function parseDevArgs(args: string[]): ParsedDevArgs {
  const passthroughArgs: string[] = [];
  const requestedPorts: string[] = [];
  let hostname = DEFAULT_HOSTNAME;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--port" || arg === "-p") {
      requestedPorts.push(requireValue(args, index, arg));
      index += 1;
      continue;
    }

    if (arg.startsWith("--port=")) {
      requestedPorts.push(arg.slice("--port=".length));
      continue;
    }

    if (arg.startsWith("-p=")) {
      requestedPorts.push(arg.slice("-p=".length));
      continue;
    }

    if (arg === "--hostname" || arg === "-H") {
      hostname = requireValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg.startsWith("--hostname=")) {
      hostname = arg.slice("--hostname=".length);
      continue;
    }

    if (arg.startsWith("-H=")) {
      hostname = arg.slice("-H=".length);
      continue;
    }

    passthroughArgs.push(arg);
  }

  return { hostname, passthroughArgs, requestedPorts };
}

function isPortAvailable(port: number, hostname: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code !== "EADDRINUSE" && error.code !== "EACCES") {
        console.error(`Unable to check WebUI port ${port} on ${hostname}: ${error.message}`);
      }
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, hostname);
  });
}

function rewriteNonBrowsableHostUrl(chunk: Buffer): string {
  return chunk.toString().replaceAll(NON_BROWSABLE_HOST_URL, WEBUI_LOCAL_URL);
}

const parsedArgs = parseDevArgs(process.argv.slice(2));
if (parsedArgs.hostname !== "127.0.0.1" && parsedArgs.hostname !== "localhost") {
  fail(
    `Refusing to expose the unauthenticated local WebUI on ${parsedArgs.hostname}. Use ${WEBUI_LOCAL_URL}.`,
  );
}
const requestedPort = parsedArgs.requestedPorts.find(
  (port) => port !== WEBUI_PORT_STRING,
);

if (requestedPort) {
  fail(
    `Refusing to start PatternCoach WebUI on port ${requestedPort}. Use the fixed URL ${WEBUI_LOCAL_URL}.`,
  );
}

if (process.env.PORT && process.env.PORT !== WEBUI_PORT_STRING) {
  fail(
    `Refusing PORT=${process.env.PORT}. PatternCoach WebUI is pinned to ${WEBUI_LOCAL_URL}.`,
  );
}

if (!(await isPortAvailable(WEBUI_PORT, parsedArgs.hostname))) {
  fail(
    `Port ${WEBUI_PORT_STRING} is already in use. Open the existing ${WEBUI_LOCAL_URL}, or stop that server before restarting. Do not start PatternCoach on another port.`,
  );
}

console.log(`PatternCoach WebUI: open ${WEBUI_LOCAL_URL}`);
console.log("The public WebUI is bound to localhost only.\n");

const child = spawn(
  process.execPath,
  [
    nextBin,
    "dev",
    "--hostname",
    parsedArgs.hostname,
    "--port",
    WEBUI_PORT_STRING,
    ...parsedArgs.passthroughArgs,
  ],
  {
    env: {
      ...process.env,
      PORT: WEBUI_PORT_STRING,
    },
    stdio: ["inherit", "pipe", "pipe"],
  },
);

child.stdout?.on("data", (chunk: Buffer) => {
  process.stdout.write(rewriteNonBrowsableHostUrl(chunk));
});

child.stderr?.on("data", (chunk: Buffer) => {
  process.stderr.write(rewriteNonBrowsableHostUrl(chunk));
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));

child.on("close", (code) => {
  process.exit(code ?? 0);
});
