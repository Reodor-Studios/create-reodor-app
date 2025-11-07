'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type SearchProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    circle: {
      initial: { scale: 1, rotate: 0 },
      animate: {
        scale: [1, 0.95, 1],
        rotate: [0, -5, 5, 0],
        transition: { duration: 0.5, ease: 'easeInOut' },
      },
    },
    line: {
      initial: { pathLength: 1, opacity: 1 },
      animate: {
        pathLength: [1, 0.8, 1],
        opacity: [1, 0.7, 1],
        transition: { duration: 0.5, ease: 'easeInOut', delay: 0.1 },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: SearchProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <motion.circle
        cx="11"
        cy="11"
        r="8"
        variants={variants.circle}
        initial="initial"
        animate={controls}
        style={{ originX: '11px', originY: '11px' }}
      />
      <motion.path
        d="m21 21-4.3-4.3"
        variants={variants.line}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Search(props: SearchProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Search,
  Search as SearchIcon,
  type SearchProps,
  type SearchProps as SearchIconProps,
};
