import {
  assertEquals,
  assertThrows
} from "https://deno.land/std@v0.35.0/testing/asserts.ts";
import { Env, parseArgs } from "../lib/cli.ts";
import { DrakeError } from "../lib/utils.ts";

Deno.test(
  function parseArgsTest() {
    const env: Env = { "--tasks": [] };
    parseArgs(
      [
        "-h",
        "-q",
        "-a",
        "-l",
        "-n",
        "task1",
        "qux=42",
        "foo_bar=Foo & Bar",
        "task2",
        "--directory",
        "tmp",
        "-f",
        "foo.ts"
      ],
      env
    );
    assertEquals(env["--dry-run"], true);
    assertEquals(env["--quiet"], true);
    assertEquals(env["--always-make"], true);
    assertEquals(env["--list-tasks"], true);
    assertEquals(env["--help"], true);
    assertEquals(env["--tasks"].length, 2);
    assertEquals(env["--tasks"][0], "task1");
    assertEquals(env["--tasks"][1], "task2");
    assertEquals(env.foo_bar, "Foo & Bar");
    assertEquals(env.qux, "42");
    assertEquals(env["--directory"], "tmp");
    assertEquals(env["--drakefile"], "foo.ts");

    assertThrows(
      () => parseArgs(["-f"], env),
      DrakeError,
      "missing --drakefile option value"
    );
    assertThrows(
      () => parseArgs(["-d"], env),
      DrakeError,
      "missing --directory option value"
    );
    assertThrows(
      () => parseArgs(["-z"], env),
      DrakeError,
      "illegal option: -z"
    );
  }
);

await Deno.runTests();
