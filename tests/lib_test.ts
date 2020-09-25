import type {
  ShCaptureOpts,
  ShOpts,
  ShOutput,
} from "../lib.ts";

// Assert compile-time API.
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
} from "../lib.ts";
export type {
  ShCaptureOpts,
  ShOpts,
  ShOutput,
} from "../lib.ts";

Deno.test("libTypesTest", function () {
  // See `mod_tests.ts` for more extensive tests.
  let shCaptureOpts: ShCaptureOpts;
  shCaptureOpts = {};

  let shOpts: ShOpts;
  shOpts = {};

  let shOutput: ShOutput;
  shOutput = { code: 1, output: "foo", error: "bar" };
});
