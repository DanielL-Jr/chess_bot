from flask import Flask, request, jsonify
from flask_cors import CORS  # Importa o CORS
import chess
import time

app = Flask(__name__)
CORS(app)

board = chess.Board()

def evaluate_board(board):
    def mobility_score(board):
        # Inicializa a pontuação
        mobility_score = 0
        
        # Define o peso da mobilidade (quanto mais movimentos legais, maior o peso)
        mobility_weight = 0.05
        
        # Conta o número total de movimentos legais possíveis
        total_legal_moves = len(list(board.legal_moves))
        
        # Adiciona a mobilidade à pontuação
        mobility_score += total_legal_moves * mobility_weight
        
        return mobility_score
    
    """Avalia a posição do tabuleiro."""
    if board.is_game_over():
        white_is_winner = board.outcome().winner
        if white_is_winner:
            return 1000
        elif white_is_winner is None:
            return 0
        else:
            return -1000
        
    material = material_counter(board)
    mobility = mobility_score(board)

    final_score = material + mobility

    return final_score

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

def sortMoves(board, previous_best_move=None):
    moves = list(board.legal_moves)  # Converte para lista
    
    # Encontra o índice do previous_best_move, se presente
    if previous_best_move in moves:
        moves.remove(previous_best_move)  # Remove o previous_best_move da lista
    
    # Enumeramos os movimentos restantes para preservar o índice
    sorted_moves = sorted(
        enumerate(moves),  # Mantém os índices originais
        key=lambda item: (
            not board.gives_check(item[1]),   # Cheques primeiro (False < True)
            not board.is_capture(item[1]),    # Capturas antes de lances normais (False < True)
            item[0]                           # Se não houver diferença, usa o índice original
        )
    )

    # Se previous_best_move não for None, coloca na primeira posição
    if previous_best_move is not None:
        return [previous_best_move] + [move for idx, move in sorted_moves]
    else:
        return [move for idx, move in sorted_moves]

logs = False

def best_move(board, max_depth=10, max_time=None):

    def negamax(board, depth, alpha, beta, color, start_time, max_time=None):
        """Executa a busca Negamax com poda alfa-beta."""

        if time.time() - start_time >= max_time:
            raise TimeoutError

        nonlocal positionsAnalysed
        positionsAnalysed += 1

        if depth == 0 or board.is_game_over():
            evaluation = color * evaluate_board(board)
            if board.is_checkmate():
                # evaluation é positivo para brancas e negativo para negras
                # color é 1 quando brancas perdem
                # color é -1 quando negras perdem
                evaluation -= depth
                # ou evaluation += depth * (color * -1)
            return evaluation

        sorted_moves = sortMoves(board)

        for move in sorted_moves:
            board.push(move)
            try:
                score = -negamax(board, depth - 1, -beta, -alpha, -color, start_time, max_time)
            except TimeoutError:
                board.pop()
                raise # Propaga a interrupção para cima

            board.pop()

            if score > alpha:
                alpha = score  # Atualiza o melhor valor encontrado

            if alpha >= beta:
                break  # Poda alfa-beta
        
        return alpha
    
    """Encontra o melhor movimento usando Iterative Deepening + Negamax + Pode Alfa-Beta"""
    board_copy = board.copy()

    best_move = next(iter(board_copy.legal_moves)) # Obtém primeiro movimento legal
    turn = board_copy.turn

    if turn == chess.WHITE:
        color = 1
    else:
        color = -1
    
    alpha = -float("inf")
    beta = float("inf")

    positionsAnalysed = 0

    start_time = time.time()  # Marca o tempo inicial

    previous_best_move = None  # Armazena o melhor lance da última profundidade

    for depth in range(1, max_depth + 1):
        current_best_move = None
        best_score = -float("inf")

        # Passa o melhor lance da profundidade anterior para sortMoves
        sorted_moves = sortMoves(board_copy, previous_best_move)

        for move in sorted_moves:
            board_copy.push(move)
            try:
                score = -negamax(board_copy, depth - 1, -beta, -alpha, -color, start_time, max_time)
            except TimeoutError:
                board_copy.pop()
                print(f"Tempo esgotado ({max_time}s), retornando lance da profundidade {depth-1}")
                return best_move

            board_copy.pop()

            if score > best_score : # Sempre maximizamos no Negamax
                best_score = score
                current_best_move = move

        # Se o tempo estourar, retorna o melhor movimento da última busca concluída
        if max_time and (time.time() - start_time) >= max_time:
            print(f"Tempo esgotado ({max_time}s), retornando lance da profundidade {depth-1}")
            return best_move
        
        # Atualiza o melhor movimento com base na última profundidade finalizada
        best_move = current_best_move
        previous_best_move = current_best_move  # Armazena para ser priorizado na próxima iteração

        print(f"Profundidade {depth} concluída - Melhor Movimento: {board_copy.san(best_move)} - Score: {best_score}")
        if logs:
                print("-" * 40)  
                input("Pressione Enter para continuar para o próximo lance...")
    
    print(f"Posições analisadas: {positionsAnalysed}")
    return best_move

@app.route("/best-move", methods=["POST"])
def get_best_move():
    global board
    data = request.json
    if "fen" not in data:
        return jsonify({"error": "FEN não fornecido"}), 400

    board.set_fen(data["fen"])
    if "depth" in data:
        move = best_move(board, max_depth=data["depth"])
    if "time" in data:
        # Usa Iterative Deepening
        move = best_move(board, max_time=data["time"])
    else:
        move = best_move(board)
    

    if move:
        return jsonify({"move": move.uci()})
    return jsonify({"error": "Nenhum movimento possível"}), 400

if __name__ == "__main__":
    app.run(debug=True, port=5000, threaded=True)
