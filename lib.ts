/* APIs that can be used in non-Drake modules. */
export { env } from "./lib/env.ts";
export {
  abort,
  debug,
  DrakeError,
  glob,
  log,
  makeDir,
  quote,
  readFile,
  remove,
  sh,
  shCapture,
  stat,
  updateFile,
  writeFile,
} from "./lib/utils.ts";
export type { ShCaptureOpts, ShOpts, ShOutput } from "./lib/utils.ts";
