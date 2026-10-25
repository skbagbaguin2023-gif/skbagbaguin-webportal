import React, { useState } from 'react';
import { PublicPage } from '../types/index.ts';
import skLogo from '../assets/images/skLogo.png';
import { ThemeToggle } from './ThemeToggle.tsx';
import { 
  Menu, 
  X, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  Sparkles, 
  Info, 
  Phone, 
  Layers, 
  Bell, 
  ChevronRight
} from 'lucide-react';

interface HeaderProps {
  currentPage: PublicPage;
  onNavigate: (page: PublicPage) => void;
  onOpenApplyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  onOpenApplyModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: PublicPage; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Layers className="w-4 h-4" /> },
    { id: 'about', label: 'About SK', icon: <Info className="w-4 h-4" /> },
    { id: 'programs', label: 'Programs', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'events', label: 'Events', icon: <Calendar className="w-4 h-4" /> },
    { id: 'announcements', label: 'Announcements', icon: <Bell className="w-4 h-4" /> },
    { id: 'services', label: 'Youth Services', icon: <FileText className="w-4 h-4" /> },
    { id: 'transparency', label: 'Transparency', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact Us', icon: <Phone className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Top Advisory Utility Strip */}
      <div className="bg-[#081830] text-slate-300 text-xs py-1.5 px-4 sm:px-8 border-b border-white/10 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-amber-400">Sangguniang Kabataan ng Barangay Bagbaguin</span>
            <span className="text-white/30">|</span>
            <span>City of Valenzuela</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <a
              href="/admin/login"
              className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
            >
              Admin Login
            </a>
            <span className="text-white/30">|</span>
            <ThemeToggle variant="header" className="p-1" />
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#0F2C59] text-white shadow-md border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Brand Zone */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg p-1"
          >
            {/* SK Logo Seal Placeholder */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 flex items-center justify-center shadow-sm shrink-0">
              <div className="w-full h-full rounded-full bg-[#0F2C59] flex items-center justify-center font-bold text-amber-400 text-xs tracking-tighter" >
                <img
                  src={skLogo}
                  alt="SK Bagbaguin Youth Assembly"
                  className="h-full w-full rounded-full object-contain pointer-events-none"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-amber-300 transition-colors whitespace-nowrap">
                SK Bagbaguin
              </span>
              <span className="text-[9px] text-slate-300 font-medium tracking-wide uppercase hidden sm:block">
                Valenzuela City Youth Portal
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 text-xs font-semibold cursor-pointer ${
                    isActive
                      ? 'bg-white/15 text-amber-300 font-bold shadow-xs'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action Zone */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle variant="header" />

            <button
              onClick={onOpenApplyModal}
              className="bg-[#F5A623] hover:bg-[#D98E16] text-[#081830] font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Request <span className="hidden sm:inline">a Service</span></span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#081830] border-t border-navy-800 px-4 pt-3 pb-6 space-y-1 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <div className="text-xs text-slate-400 font-medium px-3 py-1 uppercase tracking-wider">
              Navigation Menu
            </div>
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    onNavigate(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-amber-300 font-bold'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {link.icon}
                    <span>{link.label}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}

            <div className="pt-3 border-t border-white/10 mt-2 flex flex-col gap-2">
              <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg text-xs text-slate-300">
                <span>Dark / Night Theme</span>
                <ThemeToggle variant="header" />
              </div>

            </div>
          </div>
        )}
      </header>
    </>
  );
};
