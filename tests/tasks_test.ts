import { existsSync } from "https://deno.land/std@v0.36.0/fs/mod.ts";
import {
  assert,
  assertEquals,
  assertThrows,
  assertThrowsAsync
} from "https://deno.land/std@v0.36.0/testing/asserts.ts";
import { Task, TaskRegistry } from "../lib/tasks.ts";
import { DrakeError, env } from "../lib/utils.ts";

export function touch(path: string): void {
  Deno.openSync(path, "w");
}

Deno.test(
  async function taskRegistryTests() {
    env["--quiet"] = true;
    const taskRegistry = new TaskRegistry();

    assertThrows(
      () => taskRegistry.get("quux"),
      DrakeError,
      "missing task: quux"
    );

    let log: string[] = [];
    const action = function(this: Task) {
      log.push(this.name);
    };

    taskRegistry.desc("Task 1");
    taskRegistry.register("1", ["2", "3"], action);

    taskRegistry.desc("Task 2");
    taskRegistry.register("2", ["3"], action);

    taskRegistry.desc("Task 3");
    taskRegistry.register("3", [], action);

    assertEquals(taskRegistry.get("1").desc, "Task 1");
    assertEquals(
      taskRegistry.resolveDependencies(["1", "3", "2"]).map(task => task.name),
      ["3", "2", "1"]
    );
    await taskRegistry.run("1", "2", "3");
    assertEquals(log, ["3", "2", "1"], "execution log mismatch");

    assertEquals(
      taskRegistry.list().map(s => s.slice(-6)),
      ["Task 1", "Task 2", "Task 3"],
      "task list should have descriptions"
    );
    taskRegistry.get("2").desc = "";
    assertEquals(
      taskRegistry.list().map(s => s.slice(-6)),
      ["Task 1", "Task 3"],
      "hidden tasks are not listed"
    );
    env["--list-all"] = true;
    try {
      assertEquals(
        taskRegistry.list().length,
        3,
        "--list-all lists hidden tasks"
      );
    } finally {
      env["--list-all"] = undefined;
    }

    taskRegistry.desc("Task 4");
    taskRegistry.register("4", ["1", "4"], action);
    taskRegistry.get("2").prereqs.push("4");
    await assertThrowsAsync(
      async () => await taskRegistry.run("4"),
      DrakeError,
      "cyclic dependency between '4' and '1', cyclic dependency between '4' and '4'",
      "cyclic dependency should throw error"
    );
  }
);

Deno.test(
  async function fileTaskTest() {
    env["--quiet"] = true;
    const taskRegistry = new TaskRegistry();

    const target = "./target";
    const prereq = "./prereq";
    taskRegistry.register(target, [prereq], function() {
      touch(target);
      throw new DrakeError("file task failure");
    });

    const dir = Deno.makeTempDirSync();
    const savedCwd = Deno.cwd();
    try {
      Deno.chdir(dir);
      touch(prereq);
      let didThrow = false;
      try {
        await taskRegistry.run(target);
      } catch (e) {
        didThrow = true;
        assertEquals(e.message, "file task failure");
        assert(existsSync(prereq));
        assert(!existsSync(target), "target should have been deleted");
      }
      assert(didThrow, "should have thrown error");

      touch(target);
      const info = Deno.statSync(target);
      didThrow = false;
      try {
        await taskRegistry.run(target);
      } catch (e) {
        didThrow = true;
        assertEquals(e.message, "file task failure");
        assert(existsSync(target));
        assert(existsSync(prereq));
        assertEquals(
          Deno.statSync(target),
          info,
          "target timestamps should have been reverted"
        );
      }
      assert(didThrow, "should have thrown error");

      // Bump target timestamps to guarantee the file task is up to date.
      Deno.utimeSync(target, info.accessed! + 1, info.modified! + 1);
      didThrow = false;
      try {
        await taskRegistry.run(target);
      } catch (e) {
        didThrow = true;
      }
      assert(!didThrow, "should be up to date and skipped execution");

      Deno.removeSync(prereq);
      await assertThrowsAsync(
        async () => await taskRegistry.run(target),
        DrakeError,
        "missing prerequisite path:",
        "missing prerequisite file should throw error"
      );

      env["--dry-run"] = true;
      try {
        // Missing prerequisite should not throw error if --dry-run.
        await taskRegistry.run(target);
      } finally {
        env["--dry-run"] = undefined;
      }
    } finally {
      Deno.chdir(savedCwd);
      Deno.removeSync(dir, { recursive: true });
    }
  }
);
