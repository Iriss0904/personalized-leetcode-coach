import { PistonClient } from "@/server/tools/code-runner/piston-client";
import { PUBLIC_PYTHON_RUNTIME } from "@/server/tools/code-runner/runtime-config";

async function main() {
  const confirmed =
    process.env.CONFIRM_PISTON_RUNTIME_INSTALL === "1" ||
    process.argv.includes("--confirm");
  if (!confirmed) {
    throw new Error(
      "Runtime installation downloads files. Re-run with `npm run piston:install -- --confirm` only after a real smoke reports that Python is missing.",
    );
  }
  const client = new PistonClient();
  const packages = await client.listPackages();
  const python = packages.find(
    (entry) =>
      entry.language.toLowerCase() === PUBLIC_PYTHON_RUNTIME.language &&
      entry.language_version === PUBLIC_PYTHON_RUNTIME.version,
  );
  if (!python) {
    throw new Error(
      `Piston does not report the required Python ${PUBLIC_PYTHON_RUNTIME.version} package.`,
    );
  }
  if (python.installed) {
    console.log(`Python ${PUBLIC_PYTHON_RUNTIME.version} is already installed.`);
    return;
  }
  console.log(`Installing Python ${PUBLIC_PYTHON_RUNTIME.version}...`);
  await client.installPackage(
    PUBLIC_PYTHON_RUNTIME.language,
    PUBLIC_PYTHON_RUNTIME.version,
  );
  console.log(
    `Python ${PUBLIC_PYTHON_RUNTIME.version} installation completed. Run \`npm run piston:smoke\`.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Piston install failed.");
  process.exit(1);
});
