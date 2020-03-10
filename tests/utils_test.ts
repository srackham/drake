import * as path from "https://deno.land/std@v0.35.0/path/mod.ts";
import {
  assertEquals,
  assertNotEquals,
  assertStrContains,
  assertThrows,
  assertThrowsAsync
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
  shCapture,
  updateFile,
  writeFile
} from "../lib/utils.ts";

export function touch(path: string): void {
  Deno.openSync(path, "w");
}

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
    let files = glob("./mod.ts", "./lib/*.ts");
    assertEquals(
      files,
      ["lib/graph.ts", "lib/help.ts", "lib/tasks.ts", "lib/utils.ts", "mod.ts"]
        .map(p => normalizePath(p))
    );
    files = glob("./mod.ts", "./lib/!(graph|utils).ts");
    assertEquals(
      files,
      ["lib/help.ts", "lib/tasks.ts", "mod.ts"].map(p => normalizePath(p))
    );
    const dir = Deno.makeTempDirSync();
    try {
      Deno.mkdirSync(dir + "/a/b", { recursive: true });
      const fixtures = ["a/b/z.ts", "a/y.ts", "u", "x.ts"].map(f =>
        path.join(dir, f)
      );
      for (const f of fixtures) {
        touch(f);
      }
      files = glob(dir + "/**/*.ts", dir + "/u");
      assertEquals(files, fixtures);
      const saved = Deno.cwd();
      try {
        Deno.chdir(dir);
        files = glob("./**/*.ts", "u");
        assertEquals(
          files,
          ["./u", "a/b/z.ts", "a/y.ts", "x.ts"].map(p => normalizePath(p))
        );
        files = glob("./**/@(x|y).ts");
        assertEquals(files, ["a/y.ts", "x.ts"].map(p => normalizePath(p)));
        Deno.chdir("a");
        files = glob("../**/*.ts");
        assertEquals(
          files,
          ["../a/b/z.ts", "../a/y.ts", "../x.ts"].map(p => normalizePath(p))
        );
      } finally {
        Deno.chdir(saved);
      }
    } finally {
      Deno.removeSync(dir, { recursive: true });
    }
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
      ["lib/io.ts", "lib/io.ts"],
      ["/tmp//foobar", "/tmp/foobar"],
      ["/tmp/./foobar", "/tmp/foobar"],
      ["/tmp/../foobar", "/foobar"]
    ];
    for (let [name, expected] of tests) {
      assertEquals(normalizePath(name), normalizePath(expected));
    }
  }
);

Deno.test(
  function normalizeTaskNameTest() {
    const tests = [
      [" foobar", "foobar"],
      ["lib/io.ts", "lib/io.ts"].map(p => normalizePath(p))
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
    await assertThrowsAsync(
      async () => await sh("non-existent-command"),
      DrakeError,
      "sh: non-existent-command: error code:"
    );
    await sh(["echo Hello 1", "echo Hello 2", "echo Hello 3"]);
  }
);

Deno.test(
  async function shCaptureTest() {
    let { code, stdout, stderr } = await shCapture("echo Hello");
    assertEquals(code, 0);
    assertEquals(stdout.trimRight(), "Hello");
    assertEquals(stderr, "");

    ({ code, stdout, stderr } = await shCapture("a-nonexistent-command"));
    assertNotEquals(code, 0);
    assertEquals(stdout, "");
    assertStrContains(stderr, "a-nonexistent-command");

    const cat = Deno.build.os === "win" ? "findstr x*" : "cat";
    ({ code, stdout, stderr } = await shCapture(cat, { stdin: "Hello" }));
    assertEquals(code, 0);
    assertEquals(stdout.trimRight(), "Hello");
    assertStrContains(stderr, "");
  }
);
