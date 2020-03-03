import * as path from "https://deno.land/std@v0.35.0/path/mod.ts";
import {
  assertEquals,
  assertThrows
} from "https://deno.land/std@v0.35.0/testing/asserts.ts";
import {
  abort,
  DrakeError,
  glob,
  isFileTask,
  isNormalTask,
  normalizePath,
  normalizeTaskName,
  quote,
  readFile,
  sh,
  updateFile,
  writeFile
} from "../lib/utils.ts";

Deno.test(
  function abortTest() {
    assertThrows(
      () => abort("Abort test"),
      DrakeError,
      "Abort test"
    );
  }
);

Deno.test(
  function fileTest() {
    const dir = Deno.makeTempDirSync();
    try {
      const filename = path.join(dir, "fileTest");
      const text = "foobar";
      writeFile(filename, text);
      assertEquals(readFile(filename), text);
      updateFile(filename, /o/g, "O!");
      assertEquals(readFile(filename), "fO!O!bar");
    } finally {
      Deno.removeSync(dir, { recursive: true });
    }
  }
);

Deno.test(
  function globTest() {
    let files = glob("mod.ts");
    assertEquals(files.length, 1);
    assertEquals(files[0], "./mod.ts");
    files = glob("./lib/*.ts");
    assertEquals(
      files.sort().toString(),
      ["./lib/tasks.ts", "./lib/help.ts", "./lib/utils.ts", "./lib/cli.ts"]
        .sort()
        .toString()
    );
  }
);

Deno.test(
  function isTasksTest() {
    const tests: [string, boolean][] = [
      ["foobar", true],
      ["--foobar", false],
      ["_foo_bar_", true],
      ["42-foobar", true],
      ["./foobar", false],
      ["foobar.ts", false],
      ["/tmp/foobar", false],
      ["../foobar/", false],
      ["./foobar/quux", false],
      [".foobar", false]
    ];
    for (let [name, expected] of tests) {
      assertEquals(isNormalTask(name), expected);
      assertEquals(isFileTask(name), !expected);
    }
  }
);

Deno.test(
  function normalizePathTest() {
    const tests: [string, string][] = [
      ["foobar", "./foobar"],
      ["lib/io.ts", "./lib/io.ts"],
      ["/tmp//foobar", "/tmp/foobar"],
      ["/tmp/./foobar", "/tmp/foobar"],
      ["/tmp/../foobar", "/foobar"]
    ];
    for (let [name, expected] of tests) {
      assertEquals(normalizePath(name), expected);
    }
  }
);

Deno.test(
  function normalizeTaskNameTest() {
    const tests: [string, string][] = [
      [" foobar", "foobar"],
      ["lib/io.ts", "./lib/io.ts"]
    ];
    for (let [name, expected] of tests) {
      assertEquals(normalizeTaskName(name), expected);
    }
    assertThrows(
      () => normalizeTaskName(" "),
      DrakeError,
      "blank task name"
    );
    const name = "**/*.ts";
    assertThrows(
      () => normalizeTaskName(name),
      DrakeError,
      `wildcard task name not allowed: ${name}`
    );
  }
);

Deno.test(
  function quoteTest() {
    assertEquals(quote(["foo", '"bar"']), '"foo" "\\"bar\\""');
  }
);

Deno.test(
  async function shTest() {
    await sh("echo Hello");
  }
);

await Deno.runTests();
