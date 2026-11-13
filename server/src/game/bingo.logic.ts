export const SIZE = 5;
export const WIN_LINES = 5;

const RANGE = [0, 1, 2, 3, 4];

export function isValidBoard(board: unknown): board is number[] {
  if (!Array.isArray(board) || board.length !== SIZE * SIZE) return false;
  if (new Set(board).size !== SIZE * SIZE) return false;
  return board.every((n) => Number.isInteger(n) && n >= 1 && n <= SIZE * SIZE);
}

export function countLines(board: number[], marked: Set<number>): number {
  const isMarked = (r: number, c: number) => marked.has(board[r * SIZE + c]);
  let lines = 0;
  for (const i of RANGE) {
    if (RANGE.every((j) => isMarked(i, j))) lines++; // 가로
    if (RANGE.every((j) => isMarked(j, i))) lines++; // 세로
  }
  if (RANGE.every((i) => isMarked(i, i))) lines++; // 대각선
  if (RANGE.every((i) => isMarked(i, SIZE - 1 - i))) lines++; // 역대각선
  return lines;
}
