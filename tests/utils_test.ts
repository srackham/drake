import { existsSync } from "https://deno.land/std@v0.37.1/fs/exists.ts";
import * as path from "https://deno.land/std@v0.37.1/path/mod.ts";
import {
  assert,
  assertEquals,
  assertNotEquals,
  assertStrContains,
  assertThrows,
  assertThrowsAsync
} from "https://deno.land/std@v0.37.1/testing/asserts.ts";
import {
  abort,
  DrakeError,
  glob,
  isFileTask,
  isNormalTask,
  normalizePath,
  normalizeTaskName,
  outOfDate,
  quote,
  readFile,
  sh,
  shCapture,
  touch,
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
  function fileReadWriteUpdateTest() {
    const dir = Deno.makeTempDirSync();
    try {
      let file = path.join(dir, "fileTest");
      const text = "foobar";
      writeFile(file, text);
      assertEquals(readFile(file), text);
      updateFile(file, /o/g, "O!");
      assertEquals(readFile(file), "fO!O!bar");
      file = path.join(dir, "a/b/foobar");
      touch(file);
      assert(existsSync(file), "touched file should exist");
      const info = Deno.statSync(file);
    } finally {
      Deno.removeSync(dir, { recursive: true });
    }
  }
);

Deno.test(
  function outOfDateTest() {
    const dir = Deno.makeTempDirSync();
    try {
      const prereqs = ["a/b/z.ts", "a/y.ts", "u", "target.ts"].map(f =>
        path.join(dir, f)
      );
      touch(...prereqs);
      const target = prereqs.pop()!;
      const info = Deno.statSync(target);
      // Reduce target timestamps to guarantee out of date.
      Deno.utimeSync(target, info.accessed! - 10, info.modified! - 10);
      assert(outOfDate(target, prereqs));
      // Bump target timestamps to guarantee up to date.
      Deno.utimeSync(target, info.accessed! + 20, info.modified! + 20);
      assert(!outOfDate(target, prereqs));
      // Delete target to guarantee out of date.
      Deno.removeSync(target);
      assert(outOfDate(target, prereqs));
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
    await sh("echo Hello", { stdout: "null" });
    await assertThrowsAsync(
      async () => await sh("non-existent-command", { stderr: "null" }),
      DrakeError,
      "sh: non-existent-command: error code:"
    );
    await sh(
      ["echo Hello 1", "echo Hello 2", "echo Hello 3"],
      { stdout: "null" }
    );
  }
);

Deno.test(
  async function shCaptureTest() {
    let { code, output, error } = await shCapture("echo Hello");
    assertEquals([code, output.trimRight(), error], [0, "Hello", ""]);

    ({ code, output, error } = await shCapture("a-nonexistent-command"));
    assertNotEquals(code, 0);
    assertEquals(output, "");
    assertStrContains(error, "a-nonexistent-command");

    const cat: string = `deno eval "Deno.copy(Deno.stdout, Deno.stdin)"`;
    ({ code, output, error } = await shCapture(cat, { input: "Hello" }));
    assertEquals([code, output, error], [0, "Hello", ""]);

    ({ code, output, error } = await shCapture(cat, { input: "" }));
    assertEquals([code, output, error], [0, "", ""]);

    const text = readFile("Drakefile.ts");
    ({ code, output, error } = await shCapture(cat, { input: text }));
    assertEquals([code, output, error], [0, text, ""]);

    ({ code, output, error } = await shCapture(
      `deno eval "console.log(Deno.cwd())"`,
      { cwd: "lib" }
    ));
    assertEquals(
      [code, output.trimRight(), error],
      [0, path.join(Deno.cwd(), "lib"), ""]
    );

    ({ code, output, error } = await shCapture(
      `deno eval "console.log(Deno.env('FOO')+Deno.env('BAR'))"`,
      { env: { FOO: "foo", BAR: "bar" } }
    ));
    assertEquals([code, output.trimRight(), error], [0, "foobar", ""]);

    ({ code, output, error } = await shCapture(
      "echo Hello",
      { stdout: "null", stderr: "null" }
    ));
    assertEquals([code, output, error], [0, "", ""]);

    ({ code, output, error } = await shCapture(
      cat,
      { input: "", stdout: "inherit", stderr: "inherit" }
    ));
    assertEquals([code, output, error], [0, "", ""]);

    ({ code, output, error } = await shCapture(
      `cd examples
      deno eval "console.log(Deno.cwd())"`
    ));
    assertEquals(
      [code, output.trimRight(), error],
      [0, path.join(Deno.cwd(), "examples"), ""]
    );
  }
);
