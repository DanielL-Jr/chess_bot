const express = require("express");
const app = express();
const cors = require("cors");
const { Chess } = require("chess.js");

app.use(express.json());
app.use(cors());

app.post("/", (req, res) => {
  const fen = req.body.fen;

  const move = search(fen);

  res.status(200).json({ move });
});

function eval(fen) {
  const game = new Chess(fen);
  const board = game.board();
  let wMaterial = 0;
  let bMaterial = 0;

  for (const row of board) {
    for (const square of row) {
      if (!square) {
        continue;
      }
      let pieceValue = 0; // Garantir que pieceValue tenha um valor inicial
      switch (square.type) {
        case "r":
          pieceValue = 5;
          break;
        case "n":
          pieceValue = 3;
          break;
        case "b":
          pieceValue = 3;
          break;
        case "q":
          pieceValue = 9;
          break;
        case "p":
          pieceValue = 1;
          break;
        case "k":
          pieceValue = 0; // Rei não tem valor material
          break;
      }

      // Acumula o valor material dependendo da cor da peça
      if (square.color === "w") {
        wMaterial += pieceValue;
      } else if (square.color === "b") {
        bMaterial += pieceValue;
      }
    }
  }
  return wMaterial - bMaterial;
}

function search(fen) {
  const game = new Chess(fen);
  
  let games = Array(game.moves().length);
  let evals = Array(game.moves().length);
  for (let i = 0; i < game.moves().length; i++) {
    games[i] = new Chess(fen);
    games[i].move(game.moves()[i]);
    evals[i] = eval(games[i].fen());
  }
  let bestEval;
  let bestEvalIndex;
  if (game.turn() == "w") {
    bestEval = -Infinity;
    for (let i = 0; i < game.moves().length; i++) {
      if (evals[i] > bestEval) {
        bestEval = evals[i];
        bestEvalIndex = i;
      }
    }
  } else {
    bestEval = Infinity;
    for (let i = 0; i < game.moves().length; i++) {
      if (evals[i] < bestEval) {
        bestEval = evals[i];
        bestEvalIndex = i;
      }
    }
  }
  const move = game.moves({ verbose: true })[bestEvalIndex];
  return move;
}

app.listen(3000, () => {
  console.log("Rodando servidor na porta 3000");
});
