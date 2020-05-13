import { assertEquals, assertStrContains, path } from "../deps.ts";
import { env, shCapture, vers } from "../mod.ts";

env("--abort-exits", false);

Deno.test("cliTest", async function () {
  const denoRun = "deno run -A --quiet";
  const drake = `${denoRun} Drakefile.ts`;

  let { code, output, error } = await shCapture(
    `${drake} --version`,
  );
  assertEquals(code, 0);
  assertEquals(output.trimRight(), vers());

  ({ code, output } = await shCapture(
    `${drake} --help`,
  ));
  assertEquals(code, 0);
  assertStrContains(output, "drake - a make-like task runner for Deno.");

  ({ code, output } = await shCapture(
    `${drake} --list-tasks`,
    { env: { "NO_COLOR": "true" } },
  ));
  assertEquals(code, 0);
  assertStrContains(output, "Push changes to Github");

  ({ code, output } = await shCapture(
    `${drake} -L`,
    { env: { "NO_COLOR": "true" } },
  ));
  assertEquals(code, 0);
  assertStrContains(output, "     test\n");

  ({ code, error } = await shCapture(
    `${drake} --foobar`,
    { stderr: "piped" },
  ));
  assertEquals(code, 1);
  assertStrContains(error, "illegal option: --foobar");

  ({ code, error } = await shCapture(
    `${drake} nonexistent-task`,
    { stderr: "piped" },
  ));
  assertEquals(code, 1);
  assertStrContains(error, "missing task: nonexistent-task");

  ({ code, error } = await shCapture(
    `${drake} nonexistent-task`,
    { stderr: "piped" },
  ));
  assertEquals(code, 1);
  assertStrContains(error, "missing task: nonexistent-task");

  ({ code, error } = await shCapture(
    `${drake} -d missing-directory`,
    { stderr: "piped" },
  ));
  assertEquals(code, 1);
  assertStrContains(error, "--directory missing or not a directory");

  ({ code, output } = await shCapture(
    `${denoRun} examples/examples-drakefile.ts cwd --quiet`,
  ));
  assertEquals(code, 0);
  assertEquals(output.trimRight(), Deno.cwd());

  ({ code, output } = await shCapture(
    `${denoRun} examples/examples-drakefile.ts cwd --quiet --directory .`,
  ));
  assertEquals(code, 0);
  assertEquals(output.trimRight(), Deno.cwd());

  ({ code, output } = await shCapture(
    `${denoRun} examples/examples-drakefile.ts cwd --quiet --directory examples`,
  ));
  assertEquals(code, 0);
  assertEquals(output.trimRight(), path.join(Deno.cwd(), "examples"));
});
