export const spring = { type: 'spring', stiffness: 140, damping: 18, mass: 0.9 };

export const list = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { when: 'beforeChildren', staggerChildren: 0.08 } }
};

export const item = {
  hidden: { opacity: 0, y: 10, scale: 0.995 },
  visible: { opacity: 1, y: 0, scale: 1, transition: spring }
};

// Usage example:
// import { list, item } from './motion/variants'
// <motion.ul variants={list} initial="hidden" animate="visible"> <motion.li variants={item} /> </motion.ul>
