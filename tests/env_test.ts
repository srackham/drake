import { Env } from "../lib/env.ts";
import { DrakeError } from "../lib/utils.ts";
import { assertEquals, assertThrows } from "./deps.ts";

Deno.test("envTest", function () {
  const env = Env.create();
  const opts = [
    // "--abort-exits",
    "--always-make",
    // "--debug",
    "--cache",
    "--default-task",
    "--directory",
    "--dry-run",
    "--help",
    "--list-all",
    "--list-tasks",
    "--quiet",
    "--version",
  ];
  for (const opt of opts) {
    switch (opt) {
      case "--cache":
        assertEquals(env(opt), "");
        break;
      case "--default-task":
        assertEquals(env(opt), "");
        env(opt, "foobar");
        assertEquals(env(opt), "foobar");
        env(opt, "");
        assertEquals(env(opt), "");
        break;
      case "--directory":
        assertEquals(env(opt), Deno.cwd());
        break;
      default:
        assertEquals(env(opt), false);
        env(opt, true);
        assertEquals(env(opt), true);
        env(opt, false);
        assertEquals(env(opt), false);
    }
    assertThrows(
      () => env(opt, undefined),
      DrakeError,
      `${opt} must be a`,
    );
    assertThrows(
      () => env(opt, 42 as any),
      DrakeError,
      `${opt} must be a`,
    );
  }
  assertThrows(
    () => env("-foobar", "quux"),
    DrakeError,
    "illegal option: -foobar",
  );
  assertThrows(
    () => env("foo-bar", "quux"),
    DrakeError,
    "illegal variable name: foo-bar",
  );
  env("--tasks", []);
  assertEquals(env("--tasks"), []);
  assertThrows(
    () => env("--tasks", "quux"),
    DrakeError,
    "--tasks must be a string array",
  );
  assertThrows(
    () => env("--tasks", [1, 2, 3] as any),
    DrakeError,
    "--tasks must be a string array",
  );
});
