import { motion } from "framer-motion";

export const MobileHeroBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Animated floating orbs - Primary glow */}
      <motion.div 
        className="absolute -top-20 -right-20 w-72 md:w-[500px] h-72 md:h-[500px] bg-gradient-to-br from-primary/40 via-teal/25 to-transparent rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.6, 0.4],
          x: [0, 20, 0],
          y: [0, -10, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Secondary glow - Bottom left */}
      <motion.div 
        className="absolute -bottom-32 -left-32 w-64 md:w-[400px] h-64 md:h-[400px] bg-gradient-to-tr from-primary/30 via-emerald/20 to-transparent rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, -15, 0],
          y: [0, 15, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      
      {/* Center radial glow */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 md:w-[700px] h-80 md:h-[700px] bg-gradient-radial from-primary/20 via-primary/5 to-transparent rounded-full"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Grid pattern - subtle */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Floating decorative crosses */}
      <motion.div 
        className="absolute top-16 right-[12%] text-primary/30 text-5xl md:text-7xl font-bold select-none"
        animate={{ y: [-8, 8, -8], opacity: [0.2, 0.4, 0.2], rotate: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        +
      </motion.div>
      <motion.div 
        className="absolute bottom-28 left-[6%] text-teal/25 text-4xl md:text-5xl font-bold select-none"
        animate={{ y: [0, -10, 0], opacity: [0.15, 0.3, 0.15], rotate: [0, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        +
      </motion.div>
      <motion.div 
        className="absolute top-[55%] right-[8%] text-emerald/20 text-3xl md:text-4xl font-bold select-none"
        animate={{ y: [5, -5, 5], opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        +
      </motion.div>
      
      {/* Floating circles */}
      <motion.div 
        className="absolute bottom-36 right-[15%] w-20 md:w-28 h-20 md:h-28 border-2 border-primary/15 rounded-full"
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1], rotate: [0, 90, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute top-[30%] left-[8%] w-14 md:w-20 h-14 md:h-20 border border-teal/15 rounded-full"
        animate={{ y: [-5, 5, -5], scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute top-20 left-[30%] w-10 md:w-14 h-10 md:h-14 border border-emerald/10 rounded-full"
        animate={{ x: [-5, 5, -5], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      
      {/* Glowing dots */}
      <motion.div 
        className="absolute top-[18%] right-[10%] w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/60"
        animate={{ scale: [1, 1.8, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-[28%] left-[12%] w-3 md:w-4 h-3 md:h-4 bg-teal rounded-full shadow-lg shadow-teal/60"
        animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div 
        className="absolute top-[45%] left-[22%] w-2 h-2 bg-emerald rounded-full shadow-lg shadow-emerald/50"
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      />
      <motion.div 
        className="absolute bottom-[40%] right-[18%] w-2 h-2 bg-gold rounded-full shadow-lg shadow-gold/50"
        animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 0.8 }}
      />
      
      {/* Curved decorative lines */}
      <svg className="absolute top-0 left-0 w-full h-full opacity-[0.06]" viewBox="0 0 1440 800" preserveAspectRatio="none">
        <motion.path 
          d="M-100 500 Q 200 350 500 450 T 1000 350 T 1540 450" 
          stroke="hsl(var(--primary))" 
          strokeWidth="2" 
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
        <motion.path 
          d="M-100 580 Q 300 430 600 530 T 1100 430 T 1540 530" 
          stroke="hsl(var(--teal))" 
          strokeWidth="1.5" 
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3.5, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.path 
          d="M-100 660 Q 400 510 700 610 T 1200 510 T 1540 610" 
          stroke="hsl(var(--emerald))" 
          strokeWidth="1" 
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 4, ease: "easeInOut", delay: 1 }}
        />
      </svg>
      
      {/* Tooth/dental icon floating */}
      <motion.div 
        className="absolute top-24 left-[18%] opacity-20"
        animate={{ y: [-5, 8, -5], rotate: [-5, 5, -5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 100 100" className="w-12 md:w-16 h-12 md:h-16 text-primary">
          <path fill="currentColor" d="M50 10c-15 0-28 8-28 25 0 12 5 20 8 35 2 10 5 20 10 20s8-5 10-15c2 10 5 15 10 15s8-10 10-20c3-15 8-23 8-35 0-17-13-25-28-25z"/>
        </svg>
      </motion.div>
    </div>
  );
};
