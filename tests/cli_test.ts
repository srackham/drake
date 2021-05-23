import { shCapture, vers } from "../lib/utils.ts";
import { assert, assertEquals, path } from "./deps.ts";

Deno.test("cliTest", async function () {
  const denoRun = "deno run -A --quiet";
  const drake = `${denoRun} Drakefile.ts`;

  let { code, output, error } = await shCapture(
    `${drake} --version`,
  );
  assertEquals(code, 0);
  assertEquals(output.trimRight(), vers());

  ({ code, output, error } = await shCapture(
    `${denoRun} --unstable Drakefile.ts --version`,
  ));
  assertEquals(code, 0);
  assertEquals(output.trimRight(), vers());

  ({ code, output } = await shCapture(
    `${drake} --help`,
  ));
  assertEquals(code, 0);
  assert(output.includes("drake - a make-like task runner for Deno."));

  ({ code, output } = await shCapture(
    `${drake} --list-tasks`,
    { env: { "NO_COLOR": "true" } },
  ));
  assertEquals(code, 0);
  assert(output.includes("Push changes to Github"));

  ({ code, output } = await shCapture(
    `${drake} -L`,
    { env: { "NO_COLOR": "true" } },
  ));
  assertEquals(code, 0);
  assert(output.includes("     test\n"));

  ({ code, error } = await shCapture(
    `${drake} --foobar`,
    { stderr: "piped" },
  ));
  assertEquals(code, 1);
  assert(error.includes("illegal option: --foobar"));

  ({ code, error } = await shCapture(
    `${drake} nonexistent-task`,
    { stderr: "piped" },
  ));
  assertEquals(code, 1);
  assert(error.includes("missing task: nonexistent-task"));

  ({ code, error } = await shCapture(
    `${drake} --cache ${path.join("non-existent-dir", "cache.json")}`,
    { stderr: "piped" },
  ));
  assertEquals(code, 1);
  assert(
    error.includes(
      "--cache file directory missing or not a directory",
    ),
  );

  ({ code, error } = await shCapture(
    `${drake} -d missing-directory`,
    { stderr: "piped" },
  ));
  assertEquals(code, 1);
  assert(error.includes("--directory missing or not a directory"));

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

  ({ code, error } = await shCapture(
    `${denoRun} examples/examples-drakefile.ts abort`,
    { stderr: "piped", env: { "NO_COLOR": "true" } },
  ));
  assertEquals(code, 1);
  assert(error.includes("error: abort message"));

  ({ code, error } = await shCapture(
    `${denoRun} examples/examples-drakefile.ts abort --debug`,
    { stderr: "piped", env: { "NO_COLOR": "true" } },
  ));
  assertEquals(code, 1);
  assert(error.includes("at async run"));

  ({ code, output } = await shCapture(
    `${denoRun} examples/examples-drakefile.ts --quiet shell`,
    { env: { "NO_COLOR": "true" } },
  ));
  assertEquals(code, 0);
  assertEquals(output.trim(), "Hello World");

  ({ code, output } = await shCapture(
    `${denoRun} examples/examples-drakefile.ts shell`,
    { env: { "NO_COLOR": "true" } },
  ));
  assertEquals(code, 0);
  assert(output.includes("run: started"));
  assert(!output.includes("sh: echo Hello World"));

  ({ code, output } = await shCapture(
    `${denoRun} examples/examples-drakefile.ts --verbose shell`,
    { env: { "NO_COLOR": "true" } },
  ));
  assertEquals(code, 0);
  assert(output.includes("sh: echo Hello World"));
});
