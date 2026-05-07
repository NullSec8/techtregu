import * as FramerMotion from 'framer-motion';

const MotionDiv = FramerMotion.motion.div;

export function PageMotion({ children, className }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}

export function StaggeredGrid({ children, className }) {
  return (
    <MotionDiv
      variants={{
        animate: {
          transition: {
            staggerChildren: 0.05,
            delayChildren: 0.03,
          },
        },
      }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}