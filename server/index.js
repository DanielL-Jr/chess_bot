const express = require("express");
const app = express();
const cors = require("cors");
const { Chess } = require("chess.js");

app.use(express.json());
app.use(cors());

app.post("/", (req, res) => {
  const fen = req.body.fen;
  const game = new Chess(fen);
  const turn = game.turn() === "w" ? true : false;

  // Testar minimax com profundidade 2
  const depth = 2;
  positionsAnalysed = 0;
  const result = minimax(fen, depth, turn);
  console.log("Melhor movimento:", result.move);
  console.log(`Avaliação da posição:`, result.evaluation);

  res.status(200).json({ move: result.move });
});

function eval(fen) {
  const game = new Chess(fen);
  const board = game.board();
  let wMaterial = 0;
  let bMaterial = 0;

  if (game.isGameOver()) {
    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "b" : "w";
      if (winner === "w") {
        return Infinity;
      } else {
        return -Infinity;
      }
    } else {
      return 0;
    }
  }

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

function minimax(fen, depth, isMaximizingPlayer) {
  const game = new Chess(fen);

  if (depth === 0 || game.isGameOver()) {
    const evaluation = eval(game.fen()); // Sua função de avaliação
    return { evaluation: evaluation, move: null };
  }


  // Caso não esteja numa folha
  const moves = game.moves();

  let bestMove = null;
  let bestValue = isMaximizingPlayer ? -Infinity : Infinity;
  let bestMoves = [];

  for (const move of moves) {
    const newGame = new Chess(fen);
    newGame.move(move);

    const result = minimax(newGame.fen(), depth - 1, !isMaximizingPlayer);

    if (isMaximizingPlayer) {
      if (result.evaluation > bestValue) {
        bestValue = result.evaluation;
        bestMove = move;
        bestMoves = [move];
      } else if (result.evaluation === bestValue) {
        bestMoves.push(move);
      }
    } else {
      if (result.evaluation < bestValue) {
        bestValue = result.evaluation;
        bestMove = move;
        bestMoves = [move];
      } else if (result.evaluation === bestValue) {
        bestMoves.push(move);
      }
    }
  }

  // Escolher aleatoriamente entre os melhores movimentos
  bestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];

  const result = { evaluation: bestValue, move: bestMove };

  return result;
}

// Pegar os argumentos de linha de comando
const args = process.argv.slice(2); // Remove os dois primeiros elementos
let port = 3000; // Porta padrão

// Procurar o argumento '--port'
const portIndex = args.indexOf("--port");
if (portIndex !== -1 && args[portIndex + 1]) {
  port = parseInt(args[portIndex + 1], 10); // Define a porta especificada
}

app.listen(port, () => {
  console.log(`Rodando servidor na porta ${port}`);
});
