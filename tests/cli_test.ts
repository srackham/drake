import { assertEquals } from "https://deno.land/std@v0.33.0/testing/asserts.ts";
import { Env, parseArgs } from "../lib/cli.ts";

Deno.test(
  function parseArgsTest() {
    const env: Env = {};
    parseArgs(
      [
        "-h",
        "-q",
        "-f",
        "-l",
        "-n",
        "task1",
        "qux=42",
        "foo_bar=Foo & Bar",
        "task2"
      ],
      env
    );
    assertEquals(env["--dry-run"], true);
    assertEquals(env["--quiet"], true);
    assertEquals(env["--force"], true);
    assertEquals(env["--list"], true);
    assertEquals(env["--help"], true);
    assertEquals(env["--targets"].length, 2);
    assertEquals(env["--targets"][0], "task1");
    assertEquals(env["--targets"][1], "task2");
    assertEquals(env.foo_bar, "Foo & Bar");
    assertEquals(env.qux, "42");
  }
);

await Deno.runTests();
