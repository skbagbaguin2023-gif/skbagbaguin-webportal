import { useEffect } from 'react';

let openModalCount = 0;
let previousBodyOverflow = '';
let previousDocumentOverflow = '';

export function useModalScrollLock(isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen) return;

    if (openModalCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      previousDocumentOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    openModalCount += 1;

    return () => {
      openModalCount -= 1;
      if (openModalCount === 0) {
        document.body.style.overflow = previousBodyOverflow;
        document.documentElement.style.overflow = previousDocumentOverflow;
      }
    };
  }, [isOpen]);
}
