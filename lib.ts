/* APIs that can be used in non-Drake modules. */
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
  updateFile,
  writeFile,
} from "./lib/utils.ts";
export type {
  ShCaptureOpts,
  ShOpts,
  ShOutput,
} from "./lib/utils.ts";
