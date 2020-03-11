import {
  assertEquals,
  assertStrContains
} from "https://deno.land/std@v0.35.0/testing/asserts.ts";
import { env, shCapture, vers } from "../mod.ts";

env["--abort-exits"] = false;

Deno.test(
  async function cliTest() {
    const drake = "deno run -A drake.ts";
    let { code, stdout, stderr } = await shCapture(`${drake} --version`);
    assertEquals(code, 0);
    assertEquals(stdout.trimRight(), vers);
    assertEquals(stderr, "");

    ({ code, stdout, stderr } = await shCapture(`${drake} --help`));
    assertEquals(code, 0);
    assertStrContains(stdout, "drake - a make-like task runner for Deno.");
    assertEquals(stderr, "");

    ({ code, stdout, stderr } = await shCapture(
      `${drake} --list-tasks`,
      { env: { "NO_COLOR": "true" } }
    ));
    assertEquals(code, 0);
    assertStrContains(stdout, "Push changes to Github [test]");
    assertEquals(stderr, "");

    ({ code, stdout, stderr } = await shCapture(`${drake} --foobar`));
    assertEquals(code, 1);
    assertEquals(stdout, "");
    assertStrContains(stderr, "illegal option: --foobar");

    ({ code, stdout, stderr } = await shCapture(`${drake} nonexistent-task`));
    assertEquals(code, 1);
    assertEquals(stdout, "");
    assertStrContains(stderr, "missing task: nonexistent-task");

    ({ code, stdout, stderr } = await shCapture(`${drake} nonexistent-task`));
    assertEquals(code, 1);
    assertEquals(stdout, "");
    assertStrContains(stderr, "missing task: nonexistent-task");

    ({ code, stdout, stderr } = await shCapture(
      `${drake} -f missing-drakefile.ts`
    ));
    assertEquals(code, 1);
    assertEquals(stdout, "");
    assertStrContains(stderr, "--drakefile missing or not a regular file");

    ({ code, stdout, stderr } = await shCapture(
      `${drake} -d missing-directory`
    ));
    assertEquals(code, 1);
    assertEquals(stdout, "");
    assertStrContains(stderr, "--directory missing or not a directory");
  }
);
