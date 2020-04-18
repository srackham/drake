/*
The Graph class is used to discover task registry graph cycles (cyclic dependencies)
using a depth-first-search (DFS).

Adapted from https://stackoverflow.com/a/53995651/1136455).
See also https://www.geeksforgeeks.org/detect-cycle-in-a-graph/

*/

export class Graph {
  nodes: Map<string, string[]> = new Map();
  errors: string[] = [];

  addNode(node: string, adjacents: string[]): void {
    this.nodes.set(node, adjacents);
  }

  /**
   * Search the graph for cycles. Each cycle contributes an error message to the list of `errors`.
   * If no cycles are found the `errors` list will be empty.
   * */
  searchForCycles() {
    this.errors = [];
    let discovered: Set<string> = new Set();
    let finished: Set<string> = new Set();
    for (let node of this.nodes.keys()) {
      if (!discovered.has(node) && !finished.has(node)) {
        this.dfsVisit(node, discovered, finished);
      }
    }
  }

  private dfsVisit(
    node: string,
    discovered: Set<string>,
    finished: Set<string>,
  ) {
    discovered.add(node);
    for (let adjacent of this.nodes.get(node)!) {
      // Detect cycles.
      if (discovered.has(adjacent)) {
        this.errors.push(
          `cyclic dependency between '${node}' and '${adjacent}'`,
        );
      }
      // Recurse into DFS tree.
      if (!discovered.has(adjacent) && !finished.has(adjacent)) {
        this.dfsVisit(adjacent, discovered, finished);
      }
    }
    discovered.delete(node);
    finished.add(node);
  }
}
