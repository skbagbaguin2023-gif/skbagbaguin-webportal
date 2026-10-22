import React from 'react';
import { UserRole } from '../types/index.ts';
import { ShieldCheck, UserCheck, ArrowRightLeft } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.tsx';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
  return (
    <aside 
      aria-label="Demo role selector"
      className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 bg-[#081830]/95 text-white rounded-xl shadow-2xl border border-white/20 p-1.5 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 backdrop-blur-md"
    >
      <div className="hidden sm:flex items-center gap-2 px-2 text-xs font-medium">
        <ArrowRightLeft className="w-4 h-4 text-amber-400" />
        <span className="text-slate-300">Prototype Role:</span>
      </div>

      <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
        <button
          onClick={() => onRoleChange('resident')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
            currentRole === 'resident'
              ? 'bg-[#F5A623] text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Public Resident</span>
        </button>

        <button
          onClick={() => onRoleChange('admin')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
            currentRole === 'admin'
              ? 'bg-[#0F2C59] text-white border border-amber-400/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>SK Admin</span>
        </button>
      </div>

      <div className="border-l border-white/20 pl-1 sm:pl-1.5">
        <ThemeToggle variant="floating" className="p-1 sm:p-1.5" />
      </div>
    </aside>
  );
};

