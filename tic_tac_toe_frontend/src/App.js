import React, { useState, useEffect } from "react";
import "./App.css";
import SnakeGame from "./SnakeGame";

// Color palette
const COLORS = {
  primary: "#2196F3",
  secondary: "#1976D2",
  accent: "#FF9800",
  bg: "#fff",
  text: "#282c34",
  border: "#e9ecef"
};

// Game helpers
const emptyBoard = () => Array(9).fill(null);

// --- PUBLIC INTERFACE ---
/**
 * Returns winner ('X', 'O') or null, and winning indices if any.
 */
 // PUBLIC_INTERFACE
function calculateWinner(squares) {
  /** Returns { winner: 'X'|'O', line: [idx,...] } or null */
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6] // diag
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return { winner: squares[a], line };
    }
  }
  return null;
}

// --- PUBLIC INTERFACE ---
/**
 * Returns the optimal move for 'O' (computer) using minimax.
 */
 // PUBLIC_INTERFACE
function findBestMove(squares, isXNext) {
  // 'O' is computer; 'X' is always player one
  function minimax(sqs, isMax, depth) {
    const result = calculateWinner(sqs);
    if (result && result.winner === 'O') return { score: 10 - depth };
    if (result && result.winner === 'X') return { score: depth - 10 };
    if (!sqs.includes(null)) return { score: 0 }; // Draw
    const player = isMax ? "O" : "X";
    let moves = [];
    for (let i = 0; i < 9; ++i) {
      if (sqs[i] == null) {
        let copy = [...sqs];
        copy[i] = player;
        const { score } = minimax(copy, !isMax, depth + 1);
        moves.push({ idx: i, score });
      }
    }
    let best;
    if (isMax) best = moves.reduce((a, b) => (a.score > b.score ? a : b));
    else best = moves.reduce((a, b) => (a.score < b.score ? a : b));
    return { idx: best.idx, score: best.score };
  }
  return minimax(squares, false, 0).idx; // false: Computer is 'O'
}

function Square({ value, onClick, highlight }) {
  return (
    <button
      className="ttt-square"
      style={{
        color: value === "X" ? COLORS.primary : value === "O" ? COLORS.accent : COLORS.text,
        borderColor: highlight ? COLORS.accent : COLORS.border,
        background: highlight ? "#FFF8E1" : "#fff",
        boxShadow: highlight ? "0 0 8px #ff98009e" : undefined,
        fontWeight: highlight ? "bold" : undefined
      }}
      onClick={onClick}
      tabIndex={0}
      aria-label={`cell ${value ? value : "empty"}`}
    >
      {value}
    </button>
  );
}

function Board({ squares, onSquareClick, winnerLine }) {
  return (
    <div className="ttt-board">
      {[0, 1, 2].map((row) => (
        <div key={row} className="ttt-board-row">
          { [0, 1, 2].map((col) => {
            const idx = row * 3 + col;
            return (
              <Square
                key={idx}
                value={squares[idx]}
                onClick={() => onSquareClick(idx)}
                highlight={winnerLine && winnerLine.includes(idx)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * The main Tic Tac Toe App component.
 */
// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState("light");
  const [history, setHistory] = useState([emptyBoard()]);
  const [step, setStep] = useState(0);
  const [xIsNext, setXIsNext] = useState(true);
  const [gameMode, setGameMode] = useState("PvC"); // 'PvP' or 'PvC'
  const [autoAction, setAutoAction] = useState(false);
  const [showSnake, setShowSnake] = useState(false);

  const currentBoard = history[step];
  const winnerObj = calculateWinner(currentBoard);
  const draw = !currentBoard.includes(null) && !winnerObj;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Handle computer move
  useEffect(() => {
    if (
      gameMode === "PvC" &&
      !winnerObj &&
      !draw &&
      !xIsNext &&
      !autoAction // Prevent double-fire
    ) {
      setAutoAction(true);
      const move = findBestMove(currentBoard, xIsNext);
      if (move !== undefined) {
        setTimeout(() => {
          handleMove(move);
          setAutoAction(false);
        }, 500);
      }
    }
    // eslint-disable-next-line
  }, [xIsNext, step, gameMode]);

  // PUBLIC_INTERFACE
  function handleMove(idx) {
    if (winnerObj || currentBoard[idx]) return;
    const squares = [...currentBoard];
    squares[idx] = xIsNext ? "X" : "O";
    const newHistory = [...history.slice(0, step + 1), squares];
    setHistory(newHistory);
    setStep(newHistory.length - 1);
    setXIsNext(!xIsNext);
  }

  // PUBLIC_INTERFACE
  function jumpTo(stepIndex) {
    setStep(stepIndex);
    setXIsNext(stepIndex % 2 === 0);
  }

  // PUBLIC_INTERFACE
  function startNewGame(mode = gameMode) {
    setHistory([emptyBoard()]);
    setStep(0);
    setXIsNext(true);
    setGameMode(mode);
    setAutoAction(false);
  }

  // PUBLIC_INTERFACE
  function undoMove() {
    if (step > 0) jumpTo(step - 1);
  }

  // PUBLIC_INTERFACE
  function redoMove() {
    if (step < history.length - 1) jumpTo(step + 1);
  }

  // PUBLIC_INTERFACE
  function toggleGameMode() {
    startNewGame(gameMode === "PvP" ? "PvC" : "PvP");
  }

  // PUBLIC_INTERFACE
  function toggleTheme() {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  }

  // UI status text
  let status;
  if (winnerObj) {
    status = (
      <span>
        Winner: <span style={{ color: COLORS[winnerObj.winner === "X" ? "primary" : "accent"], fontWeight: "bold" }}>
          {winnerObj.winner}
        </span>
      </span>
    );
  } else if (draw) {
    status = <span>It's a draw!</span>;
  } else {
    status = (
      <span>
        Next: <span style={{ color: COLORS[xIsNext ? "primary" : "accent"], fontWeight: 500 }}>
          {xIsNext ? "X" : "O"}
        </span>
      </span>
    );
  }

  return (
    <div className="App" style={{ background: COLORS.bg, color: COLORS.text }}>
      <header className="ttt-header">
        <h1 className="ttt-title">Tic-Tac-Toe</h1>
        <div className="ttt-menu">
          <button
            className="ttt-btn"
            style={{
              background: !showSnake && gameMode === "PvC" ? COLORS.primary : COLORS.secondary,
              color: "#fff"
            }}
            aria-pressed={!showSnake && gameMode === "PvC"}
            onClick={() => { setShowSnake(false); startNewGame("PvC"); }}
          >Vs Computer</button>
          <button
            className="ttt-btn"
            style={{
              background: !showSnake && gameMode === "PvP" ? COLORS.primary : COLORS.secondary,
              color: "#fff",
              marginLeft: 8
            }}
            aria-pressed={!showSnake && gameMode === "PvP"}
            onClick={() => { setShowSnake(false); startNewGame("PvP"); }}
          >Vs Player</button>
          <button
            className="ttt-btn"
            style={{
              background: showSnake ? COLORS.accent : COLORS.secondary,
              color: "#fff",
              marginLeft: 8
            }}
            aria-pressed={showSnake}
            onClick={() => setShowSnake(true)}
          >Snake</button>
          <button className="ttt-btn" onClick={toggleTheme} style={{
            background: "transparent", color: COLORS.text, border: `1px solid ${COLORS.border}`, marginLeft: 8
          }}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
        {showSnake ? (
          <SnakeGame onBack={() => setShowSnake(false)} />
        ) : (
        <>
          <div className="ttt-board-container">
            <div className="ttt-status">{status}</div>
            <Board squares={currentBoard} onSquareClick={handleMove} winnerLine={winnerObj && winnerObj.line} />
          </div>
          <div className="ttt-controls">
            <button className="ttt-btn ttt-btn-tertiary" disabled={step <= 0} onClick={undoMove}>Undo</button>
            <button className="ttt-btn ttt-btn-tertiary" disabled={step >= history.length - 1} onClick={redoMove}>Redo</button>
            <button className="ttt-btn ttt-btn-tertiary" style={{ marginLeft: 8 }} onClick={() => startNewGame(gameMode)}>Restart</button>
          </div>
          <div className="ttt-history">
            <span className="ttt-history-label">Move History:</span>
            {[...Array(history.length)].map((_, i) => (
              <button
                key={i}
                className="ttt-btn ttt-history-btn"
                onClick={() => jumpTo(i)}
                style={{
                  fontWeight: i === step ? 700 : 400,
                  color: i === step ? COLORS.accent : COLORS.secondary,
                  textDecoration: i === step ? "underline" : undefined
                }}
                aria-current={i === step ? "step" : undefined}
              >{i === 0 ? "Start" : i}</button>
            ))}
          </div>
        </>
        )}
      </main>
      <footer className="ttt-footer" style={{ marginTop: 40, fontSize: 14, color: COLORS.secondary, opacity: 0.7 }}>
        <span>
          <a href="https://reactjs.org/" style={{ color: COLORS.primary, textDecoration: "none" }}>React</a> tic-tac-toe | Modern minimal UI
        </span>
      </footer>
    </div>
  );
}

export default App;
