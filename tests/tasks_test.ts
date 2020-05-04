import {
  assert,
  assertEquals,
  assertThrows,
  assertThrowsAsync,
} from "https://deno.land/std@v1.0.0-rc1/testing/asserts.ts";
import { Task, TaskRegistry } from "../lib/tasks.ts";
import { DrakeError, env, touch } from "../lib/utils.ts";

Deno.test("taskRegistryTests", async function () {
  env("--quiet", true);
  const taskRegistry = new TaskRegistry();

  assertThrows(
    () => taskRegistry.get("quux"),
    DrakeError,
    "missing task: quux",
  );

  let log: string[] = [];
  const action = function (this: Task) {
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
    taskRegistry.resolveDependencies(["1", "3", "2"]).map((task) => task.name),
    ["3", "2", "1"],
  );
  await taskRegistry.run("1", "2", "3");
  assertEquals(log, ["3", "2", "1"], "execution log mismatch");

  assertEquals(
    taskRegistry.list().map((s) => s.slice(-6)),
    ["Task 1", "Task 2", "Task 3"],
    "task list should have descriptions",
  );
  taskRegistry.get("2").desc = "";
  assertEquals(
    taskRegistry.list().map((s) => s.slice(-6)),
    ["Task 1", "Task 3"],
    "hidden tasks are not listed",
  );
  env("--list-all", true);
  try {
    assertEquals(
      taskRegistry.list().length,
      3,
      "--list-all lists hidden tasks",
    );
  } finally {
    env("--list-all", undefined);
  }

  taskRegistry.desc("Task 4");
  taskRegistry.register("4", ["1", "4"], action);
  taskRegistry.get("2").prereqs.push("4");
  await assertThrowsAsync(
    async () => await taskRegistry.run("4"),
    DrakeError,
    "cyclic dependency between '4' and '1', cyclic dependency between '4' and '4'",
    "cyclic dependency should throw error",
  );
});

Deno.test("fileTaskTest", async function () {
  env("--quiet", true);
  const taskRegistry = new TaskRegistry();

  const target = "./target";
  const prereq = "./prereq";
  let taskRan = false;
  taskRegistry.register(target, [prereq], function () {
    taskRan = true;
  });

  const dir = Deno.makeTempDirSync();
  const savedCwd = Deno.cwd();
  try {
    Deno.chdir(dir);

    touch(prereq);
    taskRan = false;
    await taskRegistry.run(target);
    assert(taskRan, "task should have executed: missing target file");

    touch(target);
    taskRan = false;
    await taskRegistry.run(target);
    assert(!taskRan, "task should not have executed: target file up to date");

    taskRan = false;
    // Set target timestamps to less than the prerequisite file guarantee the file task is out of date.
    const prereqInfo = Deno.statSync(prereq);
    const atime = new Date(prereqInfo.atime!.getTime() - 1);
    const mtime = new Date(prereqInfo.mtime!.getTime() - 1);
    Deno.utimeSync(target, atime, mtime);
    await taskRegistry.run(target);
    assert(taskRan, "task should have executed: target file out of date");

    touch(target);
    taskRan = false;
    // TODO: Drop debug messsages.
    // console.log("prereq atime:", Deno.statSync(prereq).atime!.getTime());
    // console.log("prereq mtime:", Deno.statSync(prereq).mtime!.getTime());
    // console.log("target atime:", Deno.statSync(target).atime!.getTime());
    // console.log("target mtime:", Deno.statSync(target).mtime!.getTime());
    await taskRegistry.run(target);
    assert(!taskRan, "task should not have executed: target file up to date");

    Deno.removeSync(prereq);
    await assertThrowsAsync(
      async () => await taskRegistry.run(target),
      DrakeError,
      "missing prerequisite file:",
      "missing prerequisite file should throw error",
    );

    env("--dry-run", true);
    try {
      // Missing prerequisite should not throw error if --dry-run.
      await taskRegistry.run(target);
    } finally {
      env("--dry-run", undefined);
    }
  } finally {
    Deno.chdir(savedCwd);
    Deno.removeSync(dir, { recursive: true });
  }
});
