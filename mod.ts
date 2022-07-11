/* Drake APIs. */
export { env } from "./lib/env.ts";
export type { EnvValue } from "./lib/env.ts";
export { desc, execute, run, task } from "./lib/registry.ts";
export type { Action, Task } from "./lib/tasks.ts";
export {
  abort,
  debug,
  DrakeError,
  glob,
  log,
  makeDir,
  quote,
  readFile,
  sh,
  shCapture,
  stat,
  updateFile,
  vers,
  writeFile,
} from "./lib/utils.ts";
export type { ShCaptureOpts, ShOpts, ShOutput } from "./lib/utils.ts";

import { Env, env } from "./lib/env.ts";
import { help } from "./lib/help.ts";
import { vers } from "./lib/utils.ts";

env("--abort-exits", true);

(env() as Env).parseArgs([...Deno.args]);

if (env("--help")) {
  help();
} else if (env("--version")) {
  console.log(vers());
}
