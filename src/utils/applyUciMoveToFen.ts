import { generatePseudoLegalMoves, parseFEN } from "@/utils/chess-engine";

function stringifyFEN(position: ReturnType<typeof parseFEN>): string {
  const boardRows: string[] = [];
  for (let rank = 8; rank >= 1; rank--) {
    let row = "";
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const square = String.fromCharCode("a".charCodeAt(0) + file) + rank;
      const piece = position.board.get(square);
      if (piece) {
        if (empty > 0) {
          row += empty;
          empty = 0;
        }
        const c = piece.type;
        row += piece.color === "w" ? c.toUpperCase() : c;
      } else {
        empty++;
      }
    }
    if (empty > 0) row += empty;
    boardRows.push(row);
  }
  return [
    boardRows.join("/"),
    position.turn,
    position.castling,
    position.enPassant,
    position.halfmove,
    position.fullmove,
  ].join(" ");
}

export function applyUciMoveToFen(fen: string, move: string): string | null {
  const position = parseFEN(fen);
  if (move.length < 4) return null;
  const from = move.slice(0, 2);
  const to = move.slice(2, 4);
  const promotion = move.length === 5 ? move[4] : undefined;
  const piece = position.board.get(from);
  if (!piece) return null;
  const pseudoMoves = generatePseudoLegalMoves(position, from);
  if (!pseudoMoves.includes(to)) return null;
  position.board.delete(from);
  position.board.set(to, promotion ? { type: promotion as any, color: piece.color } : piece);
  position.turn = position.turn === "w" ? "b" : "w";
  if (piece.type === "p" || position.board.has(to)) {
    position.halfmove = 0;
  } else {
    position.halfmove += 1;
  }
  if (position.turn === "w") {
    position.fullmove += 1;
  }
  // TODO: Update castling/enPassant rights
  return stringifyFEN(position);
}
