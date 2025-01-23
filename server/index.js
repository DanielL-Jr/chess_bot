const express = require("express");
const app = express();
const cors = require("cors");
const { Chess } = require("chess.js");

app.use(express.json());
app.use(cors());

app.post("/", (req, res) => {
  const fen = req.body.fen;

  // Testar minimax com profundidade 2
  const result = minimax(fen, 2, false);
  console.log("Melhor movimento:", result.move);
  console.log("Avaliação da posição:", result.evaluation);

  res.status(200).json({ move: result.move });
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

function minimax(fen, depth, isMaximizingPlayer) {
  const game = new Chess(fen);

  if (depth === 0 || game.isGameOver()) {
    const evaluation = eval(game.fen()); // Sua função de avaliação
    //console.log(`[DEPTH ${depth}] Avaliação da folha: ${evaluation} (FEN: ${fen})`);
    return { evaluation: evaluation, move: null };
  }

  //console.log(`[DEPTH ${depth}] Avaliando posição: ${fen}`);
  // Caso não esteja numa folha
  const moves = game.moves();

  let bestMove = null;
  let bestValue = isMaximizingPlayer ? -Infinity : Infinity;

  for (const move of moves) {
    const newGame = new Chess(fen);
    newGame.move(move);

    //console.log(`[DEPTH ${depth}] Testando movimento: ${move}`);

    const result = minimax(newGame.fen(), depth - 1, !isMaximizingPlayer);

    //console.log(`[DEPTH ${depth}] Movimento: ${move}, Avaliação retornada: ${result.evaluation}`);

    if (isMaximizingPlayer) {
      if (result.evaluation > bestValue) {
        bestValue = result.evaluation;
        bestMove = move;
      }
    } else {
      if (result.evaluation < bestValue) {
        bestValue = result.evaluation;
        bestMove = move;
      }
    }
  }

  //console.log( `[DEPTH ${depth}] Melhor movimento: ${bestMove}, Melhor avaliação: ${bestValue}`);

  return {
    evaluation: bestValue,
    move: bestMove,
  };
}

app.listen(3000, () => {
  console.log("Rodando servidor na porta 3000");
});
