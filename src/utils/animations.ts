// Enhanced animations and transitions for polished UI
// Framer Motion configurations for common patterns

export const animations = {
  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },

  // Slide in from bottom (modals, sheets)
  slideUp: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
    transition: { type: 'spring', damping: 25, stiffness: 300 }
  },

  // Slide in from right (side panels)
  slideRight: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
    transition: { type: 'spring', damping: 25, stiffness: 300 }
  },

  // Fade in/out
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },

  // Scale pop (achievements, celebrations)
  scalePop: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
    transition: { type: 'spring', damping: 15, stiffness: 400 }
  },

  // Bounce (notifications, badges)
  bounce: {
    initial: { scale: 0, y: -50 },
    animate: { 
      scale: 1, 
      y: 0,
      transition: {
        type: 'spring',
        damping: 10,
        stiffness: 300
      }
    },
    exit: { scale: 0, opacity: 0 }
  },

  // Stagger children (lists, cards)
  staggerChildren: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  },

  // List item
  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.2 }
  },

  // Task complete celebration
  taskComplete: {
    scale: [1, 1.2, 0.95, 1.05, 1],
    rotate: [0, 5, -5, 3, 0],
    transition: { duration: 0.6, ease: 'easeInOut' }
  },

  // Level up celebration
  levelUp: {
    scale: [1, 1.5, 1.2, 1.4, 1.3],
    rotate: [0, 360],
    transition: { duration: 1, ease: 'easeInOut' }
  },

  // Streak fire animation
  streakFire: {
    scale: [1, 1.1, 1],
    y: [0, -5, 0],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'easeInOut'
    }
  },

  // XP gain pulse
  xpPulse: {
    scale: [1, 1.15, 1],
    opacity: [1, 0.8, 1],
    transition: { duration: 0.5 }
  },

  // Warning shake
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5 }
  },

  // Button press
  buttonPress: {
    scale: 0.95,
    transition: { duration: 0.1 }
  },

  // Hover lift
  hoverLift: {
    y: -4,
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
    transition: { duration: 0.2 }
  },
};

/**
 * CSS transition classes for Tailwind
 */
export const transitionClasses = {
  base: 'transition-all duration-200 ease-in-out',
  fast: 'transition-all duration-100 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',
  bounce: 'transition-all duration-300 ease-out',
  spring: 'transition-all duration-400 ease-spring',
};

/**
 * Animation keyframes for CSS
 */
export const keyframes = `
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scale-pop {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }

  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 5px var(--primary), 0 0 10px var(--primary);
    }
    50% {
      box-shadow: 0 0 20px var(--primary), 0 0 30px var(--primary);
    }
  }

  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-3deg); }
    75% { transform: rotate(3deg); }
  }

  /* Level up celebration */
  @keyframes level-up {
    0% {
      transform: scale(0) rotate(0deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.3) rotate(180deg);
    }
    100% {
      transform: scale(1) rotate(360deg);
      opacity: 1;
    }
  }

  /* XP particle effect */
  @keyframes xp-particle {
    0% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(-100px) scale(0);
      opacity: 0;
    }
  }

  /* Streak fire flicker */
  @keyframes fire-flicker {
    0%, 100% {
      transform: scale(1) translateY(0);
      filter: hue-rotate(0deg);
    }
    50% {
      transform: scale(1.1) translateY(-5px);
      filter: hue-rotate(10deg);
    }
  }
`;

/**
 * Utility function to create stagger delay
 */
export const getStaggerDelay = (index: number, delayMs: number = 50): number => {
  return index * delayMs;
};

/**
 * Spring animation configuration
 */
export const springConfig = {
  soft: { damping: 20, stiffness: 300 },
  medium: { damping: 15, stiffness: 400 },
  bouncy: { damping: 10, stiffness: 500 },
  stiff: { damping: 25, stiffness: 700 },
};
