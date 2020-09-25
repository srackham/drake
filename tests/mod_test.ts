import type {
  Action,
  EnvValue,
  ShCaptureOpts,
  ShOpts,
  ShOutput,
  Task,
} from "../mod.ts";
import {
  env,
} from "../mod.ts";

env("--abort-exits", false); // Ensure tests throw DrakeErrors instead of exiting.

// This "test" ensures all module API types are available a compile time.
Deno.test("modTypesTest", function () {
  let envValue: EnvValue;
  envValue = "bar";

  let action: Action;
  action = function () {};

  let t: Task = { name: "foo" } as Task;
  let name: string;
  name = t.name;

  let shCaptureOpts: ShCaptureOpts;
  shCaptureOpts = {};

  let shOpts: ShOpts;
  shOpts = {};

  let shOutput: ShOutput;
  shOutput = { code: 1, output: "foo", error: "bar" };
});
