
import { useState, useEffect } from 'react';
import { Level, Cell, Board, BLACK, WHITE, EMPTY } from '../types';
import { createInitialBoard, getValidMoves, applyMove, countDiscs } from '../gameLogic';
import { getBestMove } from '../ai';
import { useGameStats } from './useGameStats';

export const useGameLogic = (level: Level) => {
  const [board, setBoard] = useState<Board>(createInitialBoard());
  const [turn, setTurn] = useState<Cell>(BLACK); 
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState({ black: 2, white: 2 });
  const [validMoves, setValidMoves] = useState<{ r: number, c: number }[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{r: number, c: number} | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'info' | 'warn'} | null>(null);

  // Stats Hook Integration
  useGameStats(gameOver, level, scores);

  useEffect(() => {
    const moves = getValidMoves(board, turn);
    setValidMoves(moves);
    const { black, white } = countDiscs(board);
    setScores({ black, white });

    if (moves.length === 0) {
      const opponent = turn === BLACK ? WHITE : BLACK;
      const opponentMoves = getValidMoves(board, opponent);
      
      if (opponentMoves.length === 0) {
        setGameOver(true);
        const result = black > white ? "You Win! 🎉" : black < white ? "AI Wins 🤖" : "Draw! 🤝";
        setToast({ msg: result, type: 'info' });
      } else {
        const message = `${turn === BLACK ? "You have no moves!" : "AI has no moves!"}`;
        setToast({ msg: message + " Passing...", type: 'warn' });
        
        const timer = setTimeout(() => {
           setTurn(opponent);
           setToast(null);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [board, turn]);

  useEffect(() => {
    if (turn === WHITE && !gameOver) {
      const aiMoves = getValidMoves(board, WHITE);
      if (aiMoves.length > 0) {
        setAiThinking(true);
        const delay = level >= 4 ? 100 : 800; 
        const timer = setTimeout(() => {
          setTimeout(() => {
             const move = getBestMove(board, WHITE, level);
             if (move) {
                executeMove(move.r, move.c);
             }
             setAiThinking(false);
          }, 50);
        }, delay);
        return () => clearTimeout(timer);
      }
    }
  }, [turn, gameOver, board, level]);

  const executeMove = (r: number, c: number) => {
    const newBoard = applyMove(board, r, c, turn);
    setBoard(newBoard);
    setLastMove({ r, c });
    setTurn(turn === BLACK ? WHITE : BLACK);
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameOver || turn !== BLACK || aiThinking) return;
    const isValid = validMoves.some(m => m.r === r && m.c === c);
    if (isValid) {
      executeMove(r, c);
    }
  };

  return {
    board,
    turn,
    gameOver,
    scores,
    validMoves,
    aiThinking,
    lastMove,
    toast,
    handleCellClick
  };
};
