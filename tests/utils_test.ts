import * as path from "https://deno.land/std@v0.35.0/path/mod.ts";
import {
  assert,
  assertEquals
} from "https://deno.land/std@v0.35.0/testing/asserts.ts";
import {
  abort,
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

function shouldThrow(
  errName: string,
  errMsg: string,
  thrower: () => any
): boolean {
  let didThrow = false;
  try {
    thrower();
  } catch (e) {
    assertEquals(e.name, errName);
    assertEquals(e.message, errMsg);
    didThrow = true;
  }
  return didThrow;
}

Deno.test(
  function abortTest() {
    assert(
      shouldThrow(
        "DrakeError",
        "Abort test",
        () => abort("Abort test")
      ),
      "abort() should throw exception"
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
    assert(
      shouldThrow(
        "DrakeError",
        "blank task name",
        () => normalizeTaskName(" ")
      ),
      "blank task name should throw exception"
    );
    const name = "**/*.ts";
    assert(
      shouldThrow(
        "DrakeError",
        `wildcard task name not allowed: ${name}`,
        () => normalizeTaskName(name)
      ),
      "wildcard task name should throw exception"
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
