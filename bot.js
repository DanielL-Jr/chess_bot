import { Chess } from "https://cdn.skypack.dev/chess.js";

/**
function eval(fen) {
  const game = new Chess(fen);
  const board = game.board();
  let wMaterial = 0;
  let bMaterial = 0;
  for (const row of board) {
    for (const square of row) {
      let pieceValue;
      switch (square.type) {
        case "r":
          pieceValue = 5;
        case "n":
          pieceValue = 3;
        case "b":
          pieceValue = 3;
        case "q":
          pieceValue = 9;
        case "k":
          pieceValue = 0;
        case "p":
          pieceValue = 1;
      }
      if (square.color == "w") {
        wMaterial += pieceValue;
      } else {
        bMaterial += pieceValue;
      }
    }
  }
  return wMaterial - bMaterial;
}

 */
