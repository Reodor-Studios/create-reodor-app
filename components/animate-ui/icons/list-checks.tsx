'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type ListChecksProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    check1: {
      initial: { pathLength: 0, opacity: 0 },
      animate: {
        pathLength: 1,
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    },
    check2: {
      initial: { pathLength: 0, opacity: 0 },
      animate: {
        pathLength: 1,
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeInOut', delay: 0.1 },
      },
    },
    check3: {
      initial: { pathLength: 0, opacity: 0 },
      animate: {
        pathLength: 1,
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeInOut', delay: 0.2 },
      },
    },
    lines: {
      initial: { opacity: 0.6 },
      animate: {
        opacity: 1,
        transition: { duration: 0.3 },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ListChecksProps) {
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
      <motion.path
        d="m3 17 2 2 4-4"
        variants={variants.check1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="m3 7 2 2 4-4"
        variants={variants.check2}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="m13 6 9 0"
        variants={variants.lines}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="m13 12 9 0"
        variants={variants.lines}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="m13 18 9 0"
        variants={variants.lines}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="m3 13 2 0"
        variants={variants.check3}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function ListChecks(props: ListChecksProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  ListChecks,
  ListChecks as ListChecksIcon,
  type ListChecksProps,
  type ListChecksProps as ListChecksIconProps,
};
