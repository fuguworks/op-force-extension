import { motion } from 'framer-motion';
import Lottie from 'react-lottie-player';

import inProgress from './loading.json';

export function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key="sp-loading"
      className="relative">
      <Lottie
        animationData={inProgress}
        loop={true}
        className="w-24 h-24 opacity-50 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block fill-black"
        play
      />
    </motion.div>
  );
}
