import { assertEquals } from "https://deno.land/std@v0.41.0/testing/asserts.ts";
import { Graph } from "../lib/graph.ts";

Deno.test(
  function graphTest() {
    const g = new Graph();
    g.addNode("u", ["v", "x"]);
    g.addNode("v", ["y"]);
    g.addNode("w", ["y", "z"]);
    g.addNode("x", ["v"]);
    g.addNode("y", ["x"]);
    g.addNode("z", ["z"]);
    g.searchForCycles();
    assertEquals(
      g.errors,
      [
        "cyclic dependency between 'x' and 'v'",
        "cyclic dependency between 'z' and 'z'",
      ],
    );
  },
);
