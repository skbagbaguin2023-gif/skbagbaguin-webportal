import React from 'react';
import { PublicPage } from '../types/index.ts';
import { ShieldCheck, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: PublicPage) => void;
  onSwitchToAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onSwitchToAdmin }) => {
  return (
    <footer className="bg-[#081830] text-slate-300 pt-14 pb-8 border-t border-navy-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Col 1: Government Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-[#0F2C59] flex items-center justify-center font-extrabold text-amber-400 text-xs">
                  SKB
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-base leading-tight">
                  SK ng Barangay Bagbaguin
                </h3>
                <p className="text-xs text-amber-400 font-medium">Lungsod ng Valenzuela, Pilipinas</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ang opisyal na digital portal ng Sangguniang Kabataan ng Barangay Bagbaguin para sa transparent, moderno, at makataong serbisyo sa kabataang Valenzuelano.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Compliant with RA 10742 & RA 10173</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
              Youth Portal Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => onNavigate('programs')} 
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Scholarships & Educational Assistance
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('services')} 
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Katipunan ng Kabataan (KK) Profiling
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('events')} 
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Inter-Sitio Sports Fest & Events
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('services')} 
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Facility & Covered Court Reservation
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('transparency')} 
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Public Budget & Liquidation Reports
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('contact')} 
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Youth Suggestion & Helpdesk
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Barangay Hall & Hotlines */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
              SK Barangay Office & Hotlines
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>4th Floor, SK Bagbaguin Office Sitio Malinis Multi-Purpose Building, Bagbaguin, Valenzuela City, Metro Manila 1440</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-mono text-slate-300">skbagbaguin.2023@gmail.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>SK Bagbaguin Number: <strong className="text-white font-mono">8352-5000</strong></span>
              </li>
              <li className="text-xs text-slate-400 pl-6">
                <span>Bagbaguin Police Sub-Station: <strong className="text-white font-mono">(02) 7975-7478 | 09686837129</strong></span>
              </li>
            </ul>
          </div>

          {/* Col 4: City Government Seals & Transparency */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
              Transparency & Affiliation
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
              <p>
                In partnership with the <strong className="text-slate-200">Valenzuela Youth Development Office (YDO)</strong> and the <strong className="text-slate-200">Department of the Interior and Local Government (DILG)</strong>.
              </p>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
                <div className="text-amber-400 font-semibold text-[11px] uppercase tracking-wide">
                  COA Audited & Full Disclosure
                </div>
                <p className="text-[11px] text-slate-400">
                  All financial expenditures, resolutions, and procurement biddings are publicly accessible pursuant to the Full Disclosure Policy.
                </p>
              </div>
              <div className="pt-1">
                <button
                  onClick={onSwitchToAdmin}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1.5 hover:underline"
                >
                  <span>Authorized SK Council Admin Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal Notice */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="text-center md:text-left">
            <p>© {new Date().getFullYear()} Sangguniang Kabataan ng Barangay Bagbaguin, Valenzuela City. All Rights Reserved.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Data Privacy Notice: All submitted youth applications and information are safeguarded pursuant to Republic Act No. 10173 (Data Privacy Act of 2012).
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
};
