'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Truck, Package } from 'lucide-react';

// Define vehicle icons and colors with more professional palette
const VEHICLE_ICONS = {
  voitures: Car,
  camions: Truck,
  chariots: Package,
  default: Car
};

const VEHICLE_COLORS = {
  voitures: '#0EA5E9', // sky blue - more professional
  camions: '#6366F1', // indigo - corporate feel
  chariots: '#8B5CF6', // violet - premium look
  default: '#0EA5E9'
};

// Define shadow effects for depth
const SHADOW_EFFECTS = {
  filter: 'drop-shadow(0 20px 13px rgb(0 0 0 / 0.08)) drop-shadow(0 8px 5px rgb(0 0 0 / 0.1))'
};

// Main animation component with responsive container
interface VehicleAnimationProps {
  vehicleType?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const VehicleAnimation: React.FC<VehicleAnimationProps> = ({ 
  vehicleType = 'default',
  className = '',
  size = 'large'
}) => {
  const [isMounted, setIsMounted] = useState(false);
  
  // Handle mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Only render on client-side
  if (!isMounted) return null;
  
  // Get the appropriate icon based on vehicle type
  const IconComponent = VEHICLE_ICONS[vehicleType as keyof typeof VEHICLE_ICONS] || VEHICLE_ICONS.default;
  const iconColor = VEHICLE_COLORS[vehicleType as keyof typeof VEHICLE_COLORS] || VEHICLE_COLORS.default;
  
  // Determine icon size based on prop
  const iconSizes = {
    small: 200,
    medium: 350,
    large: 500
  };
  const iconSize = iconSizes[size];
  
  return (
    <motion.div
      className={`fixed bottom-0 right-0 pointer-events-none z-0 opacity-10 flex items-end justify-end ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.08 }}
      transition={{ duration: 1.5 }}
      style={{ 
        // Position in bottom right corner to avoid overlapping content
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, rotate: -2, x: 100 }}
        animate={{ 
          scale: [0.9, 0.95, 0.9], 
          rotate: [-2, 2, -2],
          y: [0, -15, 0],
          x: [100, 90, 100]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 8,
          ease: "easeInOut"
        }}
        className="transform-gpu"
        style={{
          ...SHADOW_EFFECTS,
          marginBottom: '5vh',
          marginRight: '5vw'
        }}
      >
        <IconComponent size={iconSize} color={iconColor} strokeWidth={0.8} />
      </motion.div>
    </motion.div>
  );
};

export default VehicleAnimation;
