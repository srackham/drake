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
import { assertEquals } from "./deps.ts";

// Assert compile-time API.
export {
  abort,
  debug,
  desc,
  DrakeError,
  env,
  execute,
  glob,
  log,
  makeDir,
  quote,
  readFile,
  run,
  sh,
  shCapture,
  task,
  updateFile,
  vers,
  writeFile,
} from "../mod.ts";
export type {
  Action,
  EnvValue,
  ShCaptureOpts,
  ShOpts,
  ShOutput,
  Task,
} from "../mod.ts";

env("--abort-exits", false); // Ensure tests throw DrakeErrors instead of exiting.

// This "test" ensures basic conformance of exported types.
Deno.test("modTypesTest", function () {
  let envValue: EnvValue;
  envValue = "bar";
  envValue = true;
  envValue = ["foo", "bar"];

  let action: Action;
  action = function () {};

  let t: Task = {
    name: "foo",
    desc: "foo task",
    prereqs: [],
  } as unknown as Task;
  let s: string;
  let a: string[];
  s = t.name;
  assertEquals(s, "foo");
  s = t.desc;
  assertEquals(s, "foo task");
  a = t.prereqs;
  assertEquals(a, []);

  let shCaptureOpts: ShCaptureOpts;
  shCaptureOpts = {};
  shCaptureOpts = { input: "foo" };

  let shOpts: ShOpts;
  shOpts = {};
  shOpts = {
    cwd: "foo",
    env: { "x": "y" },
    stdout: "inherit",
    stderr: "inherit",
  };
  shOpts.stdout = "null";
  shOpts.stdout = "piped";
  shOpts.stderr = "null";
  shOpts.stderr = "piped";

  let shOutput: ShOutput;
  shOutput = { code: 1, output: "foo", error: "bar" };
  shOutput.code = undefined;
});
