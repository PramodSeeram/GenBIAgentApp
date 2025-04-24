import React from 'react';
import { motion } from 'framer-motion';

export const TypingAnimation = () => (
  <div className="flex space-x-1">
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
        className="w-2 h-2 bg-gray-500 rounded-full"
      />
    ))}
  </div>
);
