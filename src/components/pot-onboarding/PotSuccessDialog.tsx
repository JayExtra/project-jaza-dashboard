import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper } from 'lucide-react';
import type { Pot } from '../../types/pot';

interface PotSuccessDialogProps {
  pot: Pot;
  onDone: () => void;
}

export const PotSuccessDialog = ({ pot, onDone }: PotSuccessDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fire = confetti.create(canvas, { resize: true, useWorker: true });
    fire({ particleCount: 120, angle: 60, spread: 70, startVelocity: 65, origin: { x: 0, y: 1 } });
    fire({ particleCount: 120, angle: 120, spread: 70, startVelocity: 65, origin: { x: 1, y: 1 } });
    fire({ particleCount: 140, angle: 90, spread: 100, startVelocity: 70, origin: { x: 0.5, y: 1 } });

    return () => fire.reset();
  }, []);

  const formattedGoal = `${pot.currency} ${pot.goal.toLocaleString('en-US')}`;

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-[60] pointer-events-none" />
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-surface-lowest rounded-3xl shadow-lg max-w-md w-full border border-border/10 overflow-hidden text-center">
          <div className="p-8 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-on-primary mb-5">
              <PartyPopper size={26} />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              &ldquo;{pot.title}&rdquo; is live!
            </h2>
            <p className="text-sm text-foreground/60 mb-6">
              Your Pot has been created and is ready to share with supporters. Goal: {formattedGoal}.
            </p>
            <button
              onClick={onDone}
              className="w-full bg-primary text-on-primary font-display text-sm font-semibold rounded-xl px-8 py-3.5"
            >
              Back to Overview
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
