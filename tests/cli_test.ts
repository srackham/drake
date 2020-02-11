import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { test } from "https://deno.land/std/testing/mod.ts";
import { Env, parseArgs } from "../lib/cli.ts";

test({
  name: "parseArgs",
  fn() {
    const env: Env = { "--tasks": [] };
    parseArgs(
      ["-h", "-q", "-f", "-l", "-n", "task1", "qux=42", "foo_bar=Foo & Bar",
        "task2"],
      env
    );
    assertEquals(env["--dry-run"], true);
    assertEquals(env["--quiet"], true);
    assertEquals(env["--force"], true);
    assertEquals(env["--list"], true);
    assertEquals(env["--help"], true);
    assertEquals(env["--tasks"].length, 2);
    assertEquals(env["--tasks"][0], "task1");
    assertEquals(env["--tasks"][1], "task2");
    assertEquals(env.foo_bar, "Foo & Bar");
    assertEquals(env.qux, "42");
  }
});
