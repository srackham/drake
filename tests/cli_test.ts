import * as path from "https://deno.land/std@v0.37.1/path/mod.ts";
import {
  assertEquals,
  assertStrContains
} from "https://deno.land/std@v0.37.1/testing/asserts.ts";
import { env, shCapture, vers } from "../mod.ts";

env["--abort-exits"] = false;

Deno.test(
  async function cliTest() {
    const drake = "deno -A Drakefile.ts";
    let { code, output, error } = await shCapture(
      `${drake} --version`
    );
    assertEquals(code, 0);
    assertEquals(output.trimRight(), vers());

    ({ code, output, error } = await shCapture(
      `${drake} --help`
    ));
    assertEquals(code, 0);
    assertStrContains(output, "drake - a make-like task runner for Deno.");
    assertEquals(error, "");

    ({ code, output, error } = await shCapture(
      `${drake} --list-tasks`,
      { env: { "NO_COLOR": "true" } }
    ));
    assertEquals(code, 0);
    assertStrContains(output, "Push changes to Github");
    assertEquals(error, "");

    ({ code, output, error } = await shCapture(
      `${drake} -L`,
      { env: { "NO_COLOR": "true" } }
    ));
    assertEquals(code, 0);
    assertStrContains(output, "Push changes to Github [test]");
    assertEquals(error, "");

    ({ code, output, error } = await shCapture(
      `${drake} --foobar`
    ));
    assertEquals(code, 1);
    assertEquals(output, "");
    assertStrContains(error, "illegal option: --foobar");

    ({ code, output, error } = await shCapture(
      `${drake} nonexistent-task`
    ));
    assertEquals(code, 1);
    assertEquals(output, "");
    assertStrContains(error, "missing task: nonexistent-task");

    ({ code, output, error } = await shCapture(
      `${drake} nonexistent-task`
    ));
    assertEquals(code, 1);
    assertEquals(output, "");
    assertStrContains(error, "missing task: nonexistent-task");

    ({ code, output, error } = await shCapture(
      `${drake} -d missing-directory`
    ));
    assertEquals(code, 1);
    assertEquals(output, "");
    assertStrContains(error, "--directory missing or not a directory");

    ({ code, output, error } = await shCapture(
      `deno -A  examples/examples-drakefile.ts cwd --quiet`
    ));
    assertEquals(code, 0);
    assertEquals(output.trimRight(), Deno.cwd());
    assertStrContains(error, "");

    ({ code, output, error } = await shCapture(
      `deno -A  examples/examples-drakefile.ts cwd --quiet --directory .`
    ));
    assertEquals(code, 0);
    assertEquals(output.trimRight(), Deno.cwd());
    assertStrContains(error, "");

    ({ code, output, error } = await shCapture(
      `deno -A  examples/examples-drakefile.ts cwd --quiet --directory examples`
    ));
    assertEquals(code, 0);
    assertEquals(output.trimRight(), path.join(Deno.cwd(), "examples"));
    assertStrContains(error, "");
  }
);
