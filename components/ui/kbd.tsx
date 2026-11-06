import * as React from 'react';
import { cn } from '../../lib/cn';

export const Kbd = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <kbd
    className={cn(
      'inline-flex h-5 min-w-5 items-center justify-center rounded border border-gray-700 bg-gray-900 px-1 font-mono text-[10px] font-medium text-gray-400',
      className
    )}
    {...props}
  />
);
