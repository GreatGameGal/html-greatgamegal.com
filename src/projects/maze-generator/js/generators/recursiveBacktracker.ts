import { MazeGenerator, Cell } from "./mazeGenerator";

export class RecursiveBacktracker extends MazeGenerator {
  async run() {
    const stack: [number, number][] = [[0, 0]];
    this.addFlags(0, 0, Cell.Visited | Cell.Working);
    while (stack.length > 0) {
      if ((await this.waitForStep) !== 0) {
        return;
      }
      const current = stack.pop();
      if (current === undefined) {
        continue;
      }
      const [x, y] = current;
      const unvisitedNeighbors: [number, number][] = [];
      for (
        let neighborY = Math.max(y - 1, 0);
        neighborY <= Math.min(y + 1, this.height - 1);
        neighborY++
      ) {
        for (
          let neighborX = Math.max(x - 1, 0);
          neighborX <= Math.min(x + 1, this.width - 1);
          neighborX++
        ) {
          if (
            (neighborX === x && neighborY === y) || // Skip current
            (neighborX !== x && neighborY !== y) // No diagonals
          ) {
            continue;
          }
          const neighbor = this.getPos(neighborX, neighborY);
          if (neighbor !== undefined && !(neighbor & Cell.Visited)) {
            const neighborPos: [number, number] = [neighborX, neighborY];
            unvisitedNeighbors.push(neighborPos);
          }
        }
      }
      if (unvisitedNeighbors.length > 0) {
        const next =
          unvisitedNeighbors[
            Math.floor(Math.random() * unvisitedNeighbors.length)
          ];
        if (next[0] === x - 1) {
          this.removeFlags(x, y, Cell.WallLeft);
          this.removeFlags(next[0], next[1], Cell.WallRight);
        } else if (next[0] === x + 1) {
          this.removeFlags(x, y, Cell.WallRight);
          this.removeFlags(next[0], next[1], Cell.WallLeft);
        } else if (next[1] === y - 1) {
          this.removeFlags(x, y, Cell.WallTop);
          this.removeFlags(next[0], next[1], Cell.WallBottom);
        } else if (next[1] === y + 1) {
          this.removeFlags(x, y, Cell.WallBottom);
          this.removeFlags(next[0], next[1], Cell.WallTop);
        }
        this.addFlags(next[0], next[1], Cell.Working | Cell.Visited);
        stack.push(current);
        stack.push(next);
      }
      this.removeFlags(current[0], current[1], Cell.Working);
    }
    this.done = true;
  }
}
