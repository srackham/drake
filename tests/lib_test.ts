import type { ShCaptureOpts, ShOpts, ShOutput } from "../lib.ts";

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
export type { ShCaptureOpts, ShOpts, ShOutput } from "../lib.ts";

Deno.test("libTypesTest", function () {
  // See `mod_tests.ts` for more extensive tests.
  const shCaptureOpts: ShCaptureOpts = {};

  const shOpts: ShOpts = {};

  const shOutput: ShOutput = { code: 1, output: "foo", error: "bar" };
});
