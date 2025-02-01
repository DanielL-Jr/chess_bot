from flask import Flask, request, jsonify
from flask_cors import CORS  # Importa o CORS
import chess

app = Flask(__name__)
CORS(app)

board = chess.Board()

def evaluate_board(board):
    """Avalia a posição do tabuleiro."""
    if board.is_game_over():
        white_is_winner = board.outcome().winner
        if white_is_winner:
            return 1000
        elif white_is_winner is None:
            return 0
        else:
            return -1000
    return material_counter(board)

def material_counter(board):
    score = 0
    for piece in board.piece_map().values():
        score += piece_value(piece)
    return score

def piece_value(piece):
    """Define os valores das peças."""
    values = {
        chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3,
        chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 0
    }
    return values.get(piece.piece_type, 0) * (1 if piece.color == chess.WHITE else -1)

logs = False

def negamax(board, depth, alpha, beta, color, move_sequence=""):
        """Executa a busca Negamax com logs da poda alfa-beta."""
        if depth == 0 or board.is_game_over():
            evaluation = color * evaluate_board(board)
            if board.is_checkmate():
                # evaluation é positivo para brancas e negativo para negras
                # color é 1 quando brancas perdem
                # color é -1 quando negras perdem
                evaluation -= depth
                # ou evaluation += depth * (color * -1)
            return evaluation

        log_messages = [] # Armazena mensagens da segunda camada

        for move in board.legal_moves:
            move_notation = board.san(move)
            board.push(move)
            score = -negamax(board, depth - 1, -beta, -alpha, -color, move_sequence + " " + move_notation)
            log_messages.append(f"    {move_sequence} {move_notation} -> Score {score}")  # Indentação extra para a segunda camada
            board.pop()

            if score > alpha:
                alpha = score  # Atualiza o melhor valor encontrado

            if alpha >= beta:
                log_messages.append(f"    Poda: alpha ({alpha}) >= beta ({beta})")
                break  # Poda alfa-beta

        if logs:
            for msg in log_messages:
                print(msg)
        
        return alpha

def best_move(board, depth=3):
    """Encontra o melhor movimento usando Negamax com logs detalhados da poda alfa-beta."""
    
    best_move = None
    turn = board.turn

    if turn == chess.WHITE:
        color = 1
    else:
        color = -1
    
    alpha = -float("inf")
    beta = float("inf")

    print("==== Iniciando busca Negamax com Poda Alfa-Beta ====")

    for move in board.legal_moves:
        move_notation = board.san(move)
        board.push(move)
        score = -negamax(board, depth - 1, -beta, -alpha, -color, move_notation)
        board.pop()

        

        if logs:
            print("-" * 40)  
            input("Pressione Enter para continuar para o próximo lance...")

        if score > alpha : # Sempre maximizamos no Negamax
            print(f"{move_notation} -> Score {score}")
            alpha = score
            best_move = move
    
    if best_move is None and board.legal_moves:
        best_move = next(iter(board.legal_moves)) # Obtém primeiro movimento legal

    return best_move

@app.route("/best-move", methods=["POST"])
def get_best_move():
    global board
    data = request.json
    if "fen" not in data:
        return jsonify({"error": "FEN não fornecido"}), 400

    board.set_fen(data["fen"])
    if "depth" in data:
        move = best_move(board, data["depth"])
    else:
        move = best_move(board)
        

    if move:
        return jsonify({"move": move.uci()})
    return jsonify({"error": "Nenhum movimento possível"}), 400

if __name__ == "__main__":
    app.run(debug=True, port=5000)
