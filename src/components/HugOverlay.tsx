import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: 8 + ((i * 5.8) % 84),
  delay: (i % 5) * 0.12,
  duration: 2.2 + (i % 4) * 0.35,
  size: 18 + (i % 4) * 8,
  rotate: (i % 2 === 0 ? 1 : -1) * (10 + (i % 3) * 8),
}));

export const HugOverlay: React.FC = () => {
  const { activeHug, clearActiveHug } = useCouple();

  useEffect(() => {
    if (!activeHug) return;
    const timer = window.setTimeout(clearActiveHug, 3600);
    return () => window.clearTimeout(timer);
  }, [activeHug, clearActiveHug]);

  return (
    <AnimatePresence>
      {activeHug && (
        <motion.div
          key={activeHug.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={clearActiveHug}
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-black/35 p-4 backdrop-blur-[2px]"
        >
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: '105vh', opacity: 0, scale: 0.6, rotate: 0 }}
              animate={{
                y: '-15vh',
                opacity: [0, 1, 1, 0],
                scale: [0.6, 1.15, 1],
                rotate: p.rotate,
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: 'easeOut',
              }}
              style={{ left: `${p.left}%`, position: 'fixed', bottom: 0 }}
              className="pointer-events-none"
            >
              {activeHug.kind === 'cium' ? (
                <span style={{ fontSize: `${p.size}px` }} aria-hidden="true">
                  😘
                </span>
              ) : (
                <Heart
                  style={{ width: p.size, height: p.size }}
                  className="fill-rose-400 text-rose-300 drop-shadow-[0_2px_10px_rgba(244,114,182,0.55)]"
                />
              )}
            </motion.div>
          ))}

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 max-w-xs rounded-3xl border border-amber-300/30 bg-[#1e1333]/95 px-7 py-6 text-center text-white shadow-2xl"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20 text-3xl">
              {activeHug.kind === 'cium' ? '😘' : '🫂'}
            </div>
            <p className="font-display text-xl font-semibold text-amber-200">
              {activeHug.kind === 'cium' ? 'Cium Hangat!' : 'Peluk Erat!'}
            </p>
            <p className="mt-1 text-sm text-rose-100/90">
              Dari <span className="font-semibold">{activeHug.senderName}</span> khusus untukmu
            </p>
            {activeHug.message && (
              <p className="font-hand mt-2 text-xl text-amber-200/95">"{activeHug.message}"</p>
            )}
            <p className="mt-3 text-[11px] text-purple-200/60">Ketuk di mana saja untuk menutup</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
