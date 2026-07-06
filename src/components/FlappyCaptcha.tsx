import { useEffect, useRef, useState } from 'react';
import { Gamepad2, RefreshCw, CheckCircle2, Flame, HelpCircle } from 'lucide-react';

interface FlappyCaptchaProps {
  onVerified: () => void;
}

export default function FlappyCaptcha({ onVerified }: FlappyCaptchaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [targetScore, setTargetScore] = useState<number>(8);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [verified, setVerified] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Clique ou pressione Espaço para voar');

  // Game states held in refs to avoid re-triggering canvas loops on React render
  const gameStateRef = useRef({
    birdY: 250,
    birdVy: 0,
    birdRadius: 14,
    pipes: [] as Array<{ x: number; topHeight: number; scored: boolean }>,
    frameCounter: 0,
    score: 0,
    gameOver: false,
    gameStarted: false,
    animationId: null as number | null,
    clouds: [] as Array<{ x: number; y: number; speed: number; scale: number }>,
  });

  const GRAVITY = 0.22;
  const JUMP_FORCE = -4.8;
  const PIPE_WIDTH = 55;
  const GAP_HEIGHT = 145;
  const PIPE_SPEED = 2.0;
  const PIPE_SPACING = 270;

  // Initialize randomized target score
  useEffect(() => {
    const randomTarget = Math.floor(Math.random() * 8) + 6; // 6 to 13 points
    setTargetScore(randomTarget);
  }, []);

  // Initialize clouds
  useEffect(() => {
    const clouds = [];
    for (let i = 0; i < 4; i++) {
      clouds.push({
        x: Math.random() * 400,
        y: 40 + Math.random() * 120,
        speed: 0.2 + Math.random() * 0.3,
        scale: 0.6 + Math.random() * 0.5,
      });
    }
    gameStateRef.current.clouds = clouds;
  }, []);

  const spawnPipe = (startX = 400) => {
    const minHeight = 60;
    const maxHeight = 600 - GAP_HEIGHT - 60;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    gameStateRef.current.pipes.push({
      x: startX,
      topHeight,
      scored: false,
    });
  };

  const resetGame = () => {
    const state = gameStateRef.current;
    state.birdY = 250;
    state.birdVy = 0;
    state.pipes = [];
    state.score = 0;
    state.gameOver = false;
    state.gameStarted = false;
    state.frameCounter = 0;

    // Spawn first pipe a bit further
    spawnPipe(420);
    spawnPipe(420 + PIPE_SPACING);

    setCurrentScore(0);
    setGameOver(false);
    setGameStarted(false);
    setVerified(false);
    setStatusMessage('Clique ou pressione Espaço para voar');
  };

  const jump = () => {
    const state = gameStateRef.current;
    if (state.gameOver) {
      resetGame();
      return;
    }
    state.birdVy = JUMP_FORCE;
    if (!state.gameStarted) {
      state.gameStarted = true;
      setGameStarted(true);
      setStatusMessage('Desvie dos canos verdes!');
    }
  };

  // Keyboard and click event setup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    resetGame();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gameStateRef.current.animationId) {
        cancelAnimationFrame(gameStateRef.current.animationId);
      }
    };
  }, [targetScore]);

  // Main canvas game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updatePhysics = () => {
      const state = gameStateRef.current;
      if (state.gameOver || !state.gameStarted) return;

      // Update clouds
      state.clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x < -100) {
          cloud.x = 450;
          cloud.y = 40 + Math.random() * 120;
        }
      });

      // Update bird
      state.birdVy += GRAVITY;
      state.birdY += state.birdVy;

      // Ceiling and floor boundaries
      if (state.birdY - state.birdRadius < 0) {
        state.birdY = state.birdRadius;
        state.birdVy = 0;
      }
      if (state.birdY + state.birdRadius > 580) {
        state.gameOver = true;
        setGameOver(true);
        setStatusMessage('💀 Game Over! Reinicie para tentar');
      }

      // Update pipes
      for (let i = state.pipes.length - 1; i >= 0; i--) {
        const pipe = state.pipes[i];
        pipe.x -= PIPE_SPEED;

        // Score update
        if (!pipe.scored && pipe.x + PIPE_WIDTH < 65 - state.birdRadius) {
          pipe.scored = true;
          state.score += 1;
          setCurrentScore(state.score);

          if (state.score >= targetScore) {
            state.gameOver = true;
            setGameOver(true);
            setVerified(true);
            setStatusMessage('🎯 Meta atingida! Clique em Verificar');
          }
        }

        // Delete off-screen pipes
        if (pipe.x + PIPE_WIDTH < -20) {
          state.pipes.splice(i, 1);
        }
      }

      // Spawn pipes with proper spacing
      state.frameCounter += 1;
      const lastPipe = state.pipes[state.pipes.length - 1];
      if (!lastPipe || lastPipe.x < 400 - PIPE_SPACING) {
        spawnPipe();
      }

      // Check collision
      if (checkCollision(state)) {
        state.gameOver = true;
        setGameOver(true);
        setStatusMessage('💀 Bateu! Clique para reiniciar');
      }
    };

    const checkCollision = (state: any) => {
      const birdX = 65;
      const r = state.birdRadius;

      for (const p of state.pipes) {
        // Top pipe rect
        const topPipe = { x: p.x, y: 0, w: PIPE_WIDTH, h: p.topHeight };
        // Bottom pipe rect
        const bottomPipe = { x: p.x, y: p.topHeight + GAP_HEIGHT, w: PIPE_WIDTH, h: 600 - (p.topHeight + GAP_HEIGHT) };

        if (circleRectIntersect(birdX, state.birdY, r, topPipe) ||
            circleRectIntersect(birdX, state.birdY, r, bottomPipe)) {
          return true;
        }
      }
      return false;
    };

    const circleRectIntersect = (cx: number, cy: number, cr: number, rect: { x: number; y: number; w: number; h: number }) => {
      const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
      const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
      const dx = cx - closestX;
      const dy = cy - closestY;
      return (dx * dx + dy * dy) < (cr * cr);
    };

    const draw = () => {
      const state = gameStateRef.current;
      ctx.clearRect(0, 0, 400, 600);

      // 1. Draw beautiful Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 600);
      skyGrad.addColorStop(0, '#38bdf8'); // sky-400
      skyGrad.addColorStop(0.7, '#bae6fd'); // sky-200
      skyGrad.addColorStop(1, '#f0f9ff'); // sky-50
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 400, 600);

      // 2. Draw Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      state.clouds.forEach(cloud => {
        ctx.beginPath();
        const baseSize = 25 * cloud.scale;
        ctx.arc(cloud.x, cloud.y, baseSize, 0, Math.PI * 2);
        ctx.arc(cloud.x + baseSize * 1.1, cloud.y - baseSize * 0.3, baseSize * 0.9, 0, Math.PI * 2);
        ctx.arc(cloud.x + baseSize * 2.1, cloud.y + baseSize * 0.1, baseSize * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Pipes
      state.pipes.forEach(p => {
        // Top pipe
        const topGrad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
        topGrad.addColorStop(0, '#22c55e'); // green-500
        topGrad.addColorStop(0.4, '#86efac'); // green-300
        topGrad.addColorStop(0.8, '#15803d'); // green-700
        topGrad.addColorStop(1, '#166534'); // green-800

        ctx.fillStyle = topGrad;
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topHeight);
        
        // Top pipe lip
        ctx.fillStyle = '#166534';
        ctx.fillRect(p.x - 3, p.topHeight - 24, PIPE_WIDTH + 6, 24);
        ctx.fillStyle = topGrad;
        ctx.fillRect(p.x - 2, p.topHeight - 23, PIPE_WIDTH + 4, 22);

        // Bottom pipe
        const bottomGrad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
        bottomGrad.addColorStop(0, '#22c55e');
        bottomGrad.addColorStop(0.4, '#86efac');
        bottomGrad.addColorStop(0.8, '#15803d');
        bottomGrad.addColorStop(1, '#166534');

        const bottomY = p.topHeight + GAP_HEIGHT;
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(p.x, bottomY, PIPE_WIDTH, 600 - bottomY);

        // Bottom pipe lip
        ctx.fillStyle = '#166534';
        ctx.fillRect(p.x - 3, bottomY, PIPE_WIDTH + 6, 24);
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(p.x - 2, bottomY + 1, PIPE_WIDTH + 4, 22);
      });

      // 4. Draw Flappy Bird
      const birdX = 65;
      const birdY = state.birdY;
      const radius = state.birdRadius;

      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;

      // Body
      ctx.beginPath();
      ctx.arc(birdX, birdY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#eab308'; // yellow-500
      ctx.fill();
      ctx.strokeStyle = '#a16207'; // yellow-700
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Wing (bouncing up and down based on frame counter)
      const wingOffset = Math.sin(state.frameCounter * 0.2) * 5;
      ctx.beginPath();
      ctx.ellipse(birdX - 5, birdY + 1, 10, 6 + wingOffset * 0.4, -0.1, 0, Math.PI * 2);
      ctx.fillStyle = '#ca8a04'; // yellow-600
      ctx.fill();
      ctx.stroke();

      // Eye
      ctx.beginPath();
      ctx.arc(birdX + 5, birdY - 4, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(birdX + 6, birdY - 4, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // Beak
      ctx.beginPath();
      ctx.moveTo(birdX + 13, birdY - 2);
      ctx.lineTo(birdX + 22, birdY + 1);
      ctx.lineTo(birdX + 13, birdY + 5);
      ctx.closePath();
      ctx.fillStyle = '#f97316'; // orange-500
      ctx.fill();
      ctx.strokeStyle = '#c2410c'; // orange-700
      ctx.stroke();

      // 5. Draw Ground
      ctx.fillStyle = '#84cc16'; // lime-500
      ctx.fillRect(0, 580, 400, 20);
      ctx.fillStyle = '#65a30d'; // lime-600
      ctx.fillRect(0, 580, 400, 4);

      // 6. Draw start screen or instructions
      if (!state.gameStarted) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.fillRect(0, 0, 400, 600);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Clique para Iniciar', 200, 270);

        ctx.font = '14px system-ui, sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('Ou pressione a Barra de Espaço', 200, 305);
      }
    };

    const gameLoop = () => {
      updatePhysics();
      draw();
      gameStateRef.current.animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (gameStateRef.current.animationId) {
        cancelAnimationFrame(gameStateRef.current.animationId);
      }
    };
  }, [targetScore]);

  const progressPercent = Math.min((currentScore / targetScore) * 100, 100);

  const handleVerify = () => {
    if (verified) {
      onVerified();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
      <div 
        ref={containerRef}
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-1">
          <Gamepad2 className="w-5 h-5" />
          <span className="text-xs tracking-wider uppercase">Verificação Anti-Bot</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">🐤 Teste de Reflexo</h2>
        <p className="text-xs text-slate-500 max-w-xs mb-4">
          Para garantir que você é um desenvolvedor humano, atinja a meta jogando Flappy Bird!
        </p>

        {/* Target and Score Header */}
        <div className="flex justify-between items-center w-full bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 mb-3 text-sm">
          <div className="flex items-center gap-1.5 text-amber-700 font-medium">
            <Flame className="w-4 h-4 fill-amber-500/20 text-amber-600" />
            <span>Meta: <strong className="text-lg text-amber-600 font-black">{targetScore}</strong></span>
          </div>
          <div className="text-slate-600 font-medium">
            Sua pontuação: <strong className="text-lg text-indigo-600 font-black">{currentScore}</strong>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 mb-4">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-indigo-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Interactive Game Canvas */}
        <div className="relative w-[340px] h-[510px] sm:w-[360px] sm:h-[540px] rounded-xl overflow-hidden border-2 border-slate-300 bg-sky-300 shadow-inner">
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={600}
            onClick={jump}
            className="w-full h-full cursor-pointer touch-none"
          />
        </div>

        {/* Game status footer */}
        <div className="mt-3.5 flex flex-col items-center gap-1 text-xs">
          <span className={`font-semibold tracking-wide ${verified ? 'text-emerald-600 animate-pulse' : gameOver ? 'text-rose-600' : 'text-slate-600'}`}>
            {statusMessage}
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            Clique, toque ou pressione Barra de Espaço para voar
          </span>
        </div>

        {/* Actions bar */}
        <div className="mt-5 w-full flex gap-3">
          <button
            onClick={resetGame}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reiniciar
          </button>
          
          <button
            onClick={handleVerify}
            disabled={!verified}
            className={`flex-[1.5] px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
              verified 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer' 
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Liberar Acesso
          </button>
        </div>
      </div>
    </div>
  );
}
