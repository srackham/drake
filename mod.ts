// Drake API.
export { env } from "./lib/env.ts";
export { desc, execute, run, task } from "./lib/registry.ts";
export {
  abort,
  debug,
  DrakeError,
  glob,
  log,
  quote,
  readFile,
  sh,
  shCapture,
  ShCaptureOpts,
  ShOpts,
  ShOutput,
  updateFile,
  vers,
  writeFile,
} from "./lib/utils.ts";

import { env, parseEnv } from "./lib/env.ts";
import { help } from "./lib/help.ts";
import { vers } from "./lib/utils.ts";

env("--abort-exits", true);

// Parse command-line options into Drake environment.
parseEnv(Deno.args.slice(), env);

if (env("--help")) {
  help();
} else if (env("--version")) {
  console.log(vers());
}
