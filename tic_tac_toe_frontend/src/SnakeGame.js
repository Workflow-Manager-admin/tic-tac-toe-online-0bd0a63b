import React, { useEffect, useRef, useState } from "react";
import "./App.css";

/**
 * Minimal, modern Snake game.
 * Uses theme palette from Tic-Tac-Toe app.
 * All game state handled internally.
 */

// PUBLIC_INTERFACE
function SnakeGame({ onBack }) {
  // Board config
  const COLS = 20;
  const ROWS = 20;
  const CELL_SIZE = 16; // px
  const INIT_SPEED = 130; // ms
  const COLORS = {
    background: "var(--bg-secondary)",
    snake: "var(--color-primary)",
    snakeHead: "var(--color-accent)",
    food: "var(--color-accent)",
    border: "var(--border-color)",
    grid: "rgba(33,150,243,0.03)"
  };

  // Directions
  const DIRECTIONS = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 }, // WASD
    s: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 }
  };

  // State
  const [snake, setSnake] = useState([
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 }
  ]);
  const [food, setFood] = useState({ x: 13, y: 10 });
  const [direction, setDirection] = useState("ArrowRight");
  const [queuedDir, setQueuedDir] = useState(null);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INIT_SPEED);
  const [running, setRunning] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const intervalRef = useRef(null);
  const canvasRef = useRef(null);

  // Handle keyboard events
  useEffect(() => {
    function onKeyDown(e) {
      if (!Object.keys(DIRECTIONS).includes(e.key)) return;
      if (!running && !gameOver) return; // block if paused
      // Block direct reversal
      const next = e.key;
      const currDir = DIRECTIONS[queuedDir || direction];
      const newDir = DIRECTIONS[next];
      if (
        currDir &&
        newDir &&
        currDir.x === -newDir.x &&
        currDir.y === -newDir.y
      ) {
        return;
      }
      setQueuedDir(next);
      e.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line
  }, [direction, queuedDir, running, gameOver]);

  // Game loop
  useEffect(() => {
    if (gameOver || !running) return;
    intervalRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        let currDir = DIRECTIONS[queuedDir || direction];
        let head = prevSnake[0];
        let newHead = {
          x: head.x + currDir.x,
          y: head.y + currDir.y
        };
        let hasCollision =
          newHead.x < 0 ||
          newHead.x >= COLS ||
          newHead.y < 0 ||
          newHead.y >= ROWS ||
          prevSnake.some((seg) => seg.x === newHead.x && seg.y === newHead.y);

        if (hasCollision) {
          setGameOver(true);
          setRunning(false);
          return prevSnake;
        }

        let ateFood = newHead.x === food.x && newHead.y === food.y;
        let newSnake = [newHead, ...prevSnake];
        if (ateFood) {
          setScore((s) => s + 1);
          setFood(getRandomEmptyCell(newSnake));
          // Slightly increase speed
          setSpeed((s) => Math.max(45, Math.floor(s * 0.97)));
        } else {
          newSnake.pop();
        }

        // Update direction
        setDirection(queuedDir || direction);
        setQueuedDir(null);
        return newSnake;
      });
      // eslint-disable-next-line
    }, speed);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line
  }, [direction, queuedDir, speed, running, food, gameOver]);

  // Redraw canvas
  useEffect(() => {
    draw();
    // eslint-disable-next-line
  }, [snake, food, running, gameOver]);

  function getRandomEmptyCell(snakeArr) {
    while (true) {
      const x = Math.floor(Math.random() * COLS);
      const y = Math.floor(Math.random() * ROWS);
      if (!snakeArr.some((seg) => seg.x === x && seg.y === y)) {
        return { x, y };
      }
    }
  }

  // PUBLIC_INTERFACE
  function handleRestart() {
    setSnake([
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 }
    ]);
    setFood({ x: 13, y: 10 });
    setDirection("ArrowRight");
    setQueuedDir(null);
    setScore(0);
    setSpeed(INIT_SPEED);
    setRunning(true);
    setGameOver(false);
  }

  // PUBLIC_INTERFACE
  function handlePause() {
    setRunning((r) => !r);
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, COLS * CELL_SIZE, ROWS * CELL_SIZE);

    // Background
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary') || "#f8f9fa";
    ctx.fillRect(0, 0, COLS * CELL_SIZE, ROWS * CELL_SIZE);

    // Optional grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, ROWS * CELL_SIZE);
      ctx.stroke();
    }
    for (let j = 0; j <= ROWS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * CELL_SIZE);
      ctx.lineTo(COLS * CELL_SIZE, j * CELL_SIZE);
      ctx.stroke();
    }

    // Food
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-accent') || COLORS.food;
    ctx.beginPath();
    ctx.arc(
      (food.x + 0.5) * CELL_SIZE,
      (food.y + 0.5) * CELL_SIZE,
      CELL_SIZE * 0.35,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Snake
    // Draw tail first, head last
    for (let i = snake.length - 1; i > 0; i--) {
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-primary') || COLORS.snake;
      ctx.fillRect(
        snake[i].x * CELL_SIZE + 1,
        snake[i].y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    }
    // Head: accent color
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-accent') || COLORS.snakeHead;
    ctx.fillRect(
      snake[0].x * CELL_SIZE,
      snake[0].y * CELL_SIZE,
      CELL_SIZE,
      CELL_SIZE
    );
  }

  // UI
  return (
    <div style={{
      margin: "0 auto",
      padding: 28,
      maxWidth: 420,
      minHeight: 500,
      background: "var(--bg-primary)",
      borderRadius: 18,
      boxShadow: "0 2px 20px 0 #e9ecef22",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <h1 className="ttt-title" style={{ fontSize: "2rem", letterSpacing: 1 }}>Snake</h1>
      <div style={{ marginBottom: 10, color: "var(--color-secondary)", fontWeight: 500, fontSize: 16 }}>
        {gameOver ? <>Game Over! <span style={{ color: "var(--color-accent)", fontWeight: 900 }}>Score: {score}</span></> :
          <>Score: <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>{score}</span></>}
      </div>
      <div
        style={{
          margin: "0 0 16px 0",
          background: "var(--bg-secondary)",
          borderRadius: 8,
          border: "1.5px solid var(--border-color)",
          boxShadow: "0 1px 6px #0000001a"
        }}>
        <canvas
          ref={canvasRef}
          width={COLS * CELL_SIZE}
          height={ROWS * CELL_SIZE}
          style={{ display: "block", background: "var(--bg-secondary)", borderRadius: 8 }}
          tabIndex={0}
          aria-label="Snake Game Board"
        />
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        <button
          className="ttt-btn"
          style={{
            background: "var(--color-primary)",
            minWidth: 95
          }}
          onClick={gameOver ? handleRestart : handlePause}
        >
          {gameOver ? "Restart" : running ? "Pause" : "Resume"}
        </button>
        <button
          className="ttt-btn ttt-btn-tertiary"
          style={{ minWidth: 83 }}
          onClick={onBack}
        >
          Back
        </button>
      </div>
      <div style={{
        color: "var(--text-secondary)",
        fontSize: 13.5,
        marginBottom: 8,
        maxWidth: 380,
        textAlign: "center"
      }}>
        <strong>Controls:</strong>&nbsp;Arrow keys (or WASD), pause, restart.<br />
        Eat <span style={{ color: "var(--color-accent)" }}>●</span> to grow!
      </div>
      <div style={{ color: "var(--border-color)", fontSize: 11, marginTop: 8 }}>
        Modern minimalist snake &nbsp;&mdash;&nbsp; React demo
      </div>
    </div>
  );
}

export default SnakeGame;
