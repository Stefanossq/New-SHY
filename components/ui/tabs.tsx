import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { cn } from '../../lib/cn';

/** Radix Tabs: roving focus with ←/→, Home/End and proper tab/tabpanel ARIA roles. */
export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'flex items-center gap-1 overflow-x-auto custom-scrollbar rounded-xl border border-gray-800 bg-gray-950/70 p-1',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-gray-400 transition-all cursor-pointer',
      'hover:text-gray-100 hover:bg-gray-800/50',
      'data-[state=active]:bg-gray-800 data-[state=active]:text-cyan-300 data-[state=active]:shadow-sm data-[state=active]:shadow-black/40',
      '[&_svg]:size-4',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn('mt-4 animate-fade-in focus-visible:outline-none', className)} {...props} />
));
TabsContent.displayName = 'TabsContent';
