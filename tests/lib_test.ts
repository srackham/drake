import type {
  ShCaptureOpts,
  ShOpts,
  ShOutput,
} from "../lib.ts";

// This "test" ensures all library API types are available a compile time.
Deno.test("libTypesTest", function () {
  let shCaptureOpts: ShCaptureOpts;
  shCaptureOpts = {};

  let shOpts: ShOpts;
  shOpts = {};

  let shOutput: ShOutput;
  shOutput = { code: 1, output: "foo", error: "bar" };
});
