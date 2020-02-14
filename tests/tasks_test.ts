import { Env } from "../lib/cli.ts";
import { TaskRegistry } from "../lib/tasks.ts";
import { assertEquals } from "./deps.ts";

Deno.test(
  function resolveActionsTest() {
    const env: Env = {};
    const taskRegistry = new TaskRegistry(env);

    taskRegistry.desc("Task 1");
    taskRegistry.register("1", ["2", "3"], () => {});

    taskRegistry.desc("Task 2");
    taskRegistry.register("2", ["3"], () => {});

    taskRegistry.desc("Task 3");
    taskRegistry.register("3", [], () => {});

    assertEquals(taskRegistry.get("1").desc, "Task 1");
    assertEquals(
      taskRegistry.resolveActions(["1", "3", "2"]).map(task => task.name),
      ["3", "2", "1"]
    );
  }
);

await Deno.runTests();
