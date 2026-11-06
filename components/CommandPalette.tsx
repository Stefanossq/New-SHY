import React from 'react';
import { Command } from 'cmdk';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Search } from 'lucide-react';

export interface PaletteAction {
  id: string;
  group: string;
  label: string;
  icon: React.ElementType;
  keywords?: string[];
  shortcut?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: PaletteAction[];
}

/**
 * Ctrl/⌘+K command palette (cmdk): an accelerator for experienced users that keeps the
 * main UI uncluttered (Nielsen #7 — flexibility and efficiency of use).
 */
export function CommandPalette({ open, onOpenChange, actions }: CommandPaletteProps) {
  const groups = Array.from(new Set(actions.map((a) => a.group)));

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Paleta de comandos"
      overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-overlay-in"
      contentClassName="fixed left-1/2 top-[18vh] z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-2xl shadow-black/60 animate-fade-in"
    >
      <DialogPrimitive.Title className="sr-only">Paleta de comandos</DialogPrimitive.Title>
      <div className="flex items-center gap-2 border-b border-gray-800 px-3">
        <Search className="h-4 w-4 shrink-0 text-gray-500" />
        <Command.Input
          placeholder="O que você quer fazer?"
          className="h-12 w-full bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none"
        />
      </div>
      <Command.List className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
        <Command.Empty className="py-8 text-center text-xs text-gray-500">Nenhuma ação encontrada.</Command.Empty>
        {groups.map((group) => (
          <Command.Group
            key={group}
            heading={group}
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-gray-500"
          >
            {actions
              .filter((a) => a.group === group)
              .map((a) => {
                const Icon = a.icon;
                return (
                  <Command.Item
                    key={a.id}
                    value={`${a.label} ${(a.keywords ?? []).join(' ')}`}
                    onSelect={() => {
                      onOpenChange(false);
                      a.run();
                    }}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-gray-300 data-[selected=true]:bg-gray-800 data-[selected=true]:text-white"
                  >
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="flex-1">{a.label}</span>
                    {a.shortcut && <span className="font-mono text-[10px] text-gray-500">{a.shortcut}</span>}
                  </Command.Item>
                );
              })}
          </Command.Group>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}
