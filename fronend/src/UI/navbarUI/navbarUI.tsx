'use client';

import { Drawer as VaulHeader } from 'vaul';
import type { ReactNode } from 'react';

interface DrawerProps {
  children: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  trigger?: ReactNode;
}

export function HeaderDrawer({
  children,
  open,
  setOpen,
  trigger,
}: DrawerProps) {
  return (
    <VaulHeader.Root
      open={open}
      direction="top"
      onOpenChange={setOpen}
    >
      {trigger && (
        <VaulHeader.Trigger asChild>
          {trigger}
        </VaulHeader.Trigger>
      )}
      <VaulHeader.Portal>
        <VaulHeader.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99]" />
        <VaulHeader.Content className="fixed top-0 left-0 right-0 z-[100] bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-xl focus:outline-none rounded-b-[2rem]">
          <div className="w-full max-h-[85vh] overflow-y-auto">
             {children}
             {/* Handle for drag indication - optional for top drawer but good for affordance */}
             <div className="w-full mx-auto p-4 flex justify-center">
                <div className="h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700" />
             </div>
          </div>
        </VaulHeader.Content>
      </VaulHeader.Portal>
    </VaulHeader.Root>
  );
}

export function DrawerContent({ children }: { children: ReactNode }) {
  return <div className="p-4">{children}</div>;
}

