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

  const moves = game.moves();
  const games = [];
  const evals = [];

  for (let i = 0; i < moves.length; i++) {
    const newGame = new Chess(fen);
    newGame.move(moves[i]);

    games.push(newGame);
    evals.push(eval(newGame.fen()));
  }

  let bestEval = game.turn() === "w" ? -Infinity : Infinity;
  let bestMoves = [];

  for (let i = 0; i < evals.length; i++) {
    if (
      (game.turn() == "w" && evals[i] > bestEval) ||
      (game.turn() == "b" && evals[i] < bestEval)
    ) {
      bestEval = evals[i];
      bestMoves.length = 0;
      bestMoves.push(moves[i]);
    } else if (evals[i] === bestEval) {
      bestMoves.push(moves[i]);
    }
  }

  // Escolher movimento aleatório entre os melhores
  const randomIndex = Math.floor(Math.random() * bestMoves.length);
  const chosenMove = game.move(bestMoves[randomIndex]);

  return chosenMove;
}

app.listen(3000, () => {
  console.log("Rodando servidor na porta 3000");
});
