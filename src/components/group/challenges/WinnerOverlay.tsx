import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  winnerName: string;
  challengeTitle: string;
}

// Confete simples usando canvas
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number }[] = [];
    const colors = ['#f59e0b', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#ec4899'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
      });
    }

    let animId: number;
    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size * 0.5);
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > canvas!.height) { p.y = -10; p.x = Math.random() * canvas!.width; }
      });
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export default function WinnerOverlay({ open, onClose, winnerName, challengeTitle }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm text-center relative overflow-hidden">
        <ConfettiCanvas />
        <div className="relative z-10 py-6 space-y-4">
          <div className="flex justify-center">
            <Trophy className="h-16 w-16 text-yellow-500 drop-shadow-lg" />
          </div>
          <h2 className="text-2xl font-bold">Desafio Encerrado!</h2>
          <p className="text-muted-foreground text-sm">{challengeTitle}</p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Vencedor</p>
            <p className="text-xl font-bold text-yellow-600">{winnerName}</p>
          </div>
          <Button onClick={onClose} className="w-full">Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
