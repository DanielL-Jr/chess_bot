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
  const result = alphaBeta(game, depth, -Infinity, Infinity, turn);
  console.log(`Posições analisadas: ${positionsAnalysed}`);
  console.log(`Melhor movimento: ${result.move}`);
  console.log(`Avaliação da posição: ${result.evaluation}`);

  res.status(200).json({ move: result.move });
});

const WIN_VALUE = 1000;
const DRAW_VALUE = 0;
const LOSS_VALUE = -1000;

function eval(game) {
  const board = game.board();
  let wMaterial = 0;
  let bMaterial = 0;

  if (game.isGameOver()) {
    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "b" : "w";
      if (winner === "w") {
        return WIN_VALUE;
      } else {
        return LOSS_VALUE;
      }
    } else {
      return DRAW_VALUE;
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

let positionsAnalysed;

function alphaBeta(game, depth, alpha, beta, isMaximizingPlayer) {
  if (depth === 0 || game.isGameOver()) {
    const evaluation = eval(game); // Sua função de avaliação
    positionsAnalysed++;
    return { evaluation: evaluation, move: null };
  }

  // Caso não esteja numa folha
  const moves = game.moves();
  const orderedMoves = orderMoves(moves, game);

  let bestMove = null;
  let bestMoves = [];

  // MAX
  if (isMaximizingPlayer) {
    let maxEval = -Infinity;

    // BUSCA EM NÓS FILHOS
    for (const move of orderedMoves) {
      game.move(move);
      const result = alphaBeta(game, depth - 1, alpha, beta, false);
      game.undo();

      if (result.evaluation > maxEval) {
        maxEval = result.evaluation;
        bestMove = move;
        bestMoves = [move];
      } else if (result.evaluation === maxEval) {
        bestMoves.push(move);
      }
      alpha = Math.max(alpha, result.evaluation);

      // Pruning
      if (beta <= alpha) {
        break;
      }
    }
    // Escolher aleatoriamente entre os melhores movimentos
    bestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];

    return { evaluation: maxEval, move: bestMove };
  }

  // MIN
  else {
    let minEval = Infinity;

    // BUSCA EM NÓS FILHOS
    for (const move of orderedMoves) {
      game.move(move);
      const result = alphaBeta(game, depth - 1, alpha, beta, true);
      game.undo();

      if (result.evaluation < minEval) {
        minEval = result.evaluation;
        bestMove = move;
        bestMoves = [move];
      } else if (result.evaluation === minEval) {
        bestMoves.push(move);
      }
      beta = Math.min(beta, result.evaluation);

      // Pruning
      if (beta <= alpha) {
        break;
      }
    }
    // Escolher aleatoriamente entre os melhores movimentos
    bestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];

    return { evaluation: minEval, move: bestMove };
  }
}

function getMoveValue(move, game) {
  const pieceValues = {
    p: 1, // Peão
    n: 3, // Cavalo
    b: 3, // Bispo
    r: 5, // Torre
    q: 9, // Rainha
    k: 0, // Rei (não deve ser capturado, então valor 0)
  };

  if (move.captured) {
    return pieceValues[move.captured.toLowerCase()] || 0;
  }

  return 0; // Se não for captura
}

function orderMoves(moves, game) {
  return moves.sort((a, b) => {
    const valueA = getMoveValue(a, game);
    const valueB = getMoveValue(b, game);
    return valueB - valueA;
  });
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
