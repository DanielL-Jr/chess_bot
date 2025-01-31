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
            return float("inf")
        elif not white_is_winner:
            return -float("inf")
        else:
            return 0
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

def negamax(board, depth, color, move_sequence=""):
        """Executa a busca Minimax e armazena mensagens organizadas por camadas."""
        if depth == 0 or board.is_game_over():
            evaluation = evaluate_board(board)
            return evaluation

        log_messages = [] # Armazena mensagens da segunda camada
        best_score = -float("inf") # No negamax sempre se maximiza

        for move in board.legal_moves:
            move_notation = board.san(move)
            board.push(move)
            score = -negamax(board, depth - 1, -color, move_sequence + " " + move_notation)
            log_messages.append(f"    {move_sequence} {move_notation} -> Score {score}")  # Indentação extra para a segunda camada
            board.pop()
            best_score = max(best_score, score)
                
        if logs:
            for msg in log_messages:
                print(msg)
        
        return best_score

def best_move(board, depth=3):
    """Encontra o melhor movimento usando Minimax e exibe a busca organizada."""
    
    best_move = None
    turn = board.turn

    best_score = -float("inf")
    if turn == chess.WHITE:
        color = 1
    else:
        color = -1

    print("==== Iniciando busca Minimax ====")

    for move in board.legal_moves:
        move_notation = board.san(move)
        board.push(move)
        score = -negamax(board, depth - 1, -color, move_notation)
        board.pop()

        print(f"{move_notation} -> Score {score}")

        if logs:
            print("-" * 40)  
            input("Pressione Enter para continuar para o próximo lance...")

        if score > best_score : # Sempre maximizamos no Negamax
            best_score = score
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
