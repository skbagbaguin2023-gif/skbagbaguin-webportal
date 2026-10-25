import React from 'react';
import { ArrowRight, CheckCircle, Clock, FileText, Printer, Sparkles, UserCheck } from 'lucide-react';
import type { YouthService } from '../../types/index.ts';
import Reveal from '../../components/Reveal.jsx';

interface YouthServicesViewProps {
  services: YouthService[];
  onOpenApplyModal: (service?: string) => void;
}

export const YouthServicesView: React.FC<YouthServicesViewProps> = ({
  services,
  onOpenApplyModal,
}) => {
  const activeServices = services.filter((service) => service.isActive);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Reveal className="bg-[#0F2C59] text-white rounded-2xl p-6 sm:p-10 border border-navy-800 shadow-md">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-white/10 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>e-Services Citizen's Charter</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Youth Services
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Browse the services currently offered by Sangguniang Kabataan ng Bagbaguin.
          </p>
        </div>
      </Reveal>

      {activeServices.length === 0 ? (
        <p className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center text-sm text-slate-600 dark:text-slate-300">
          There are no services available at this time.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {activeServices.map((service, index) => {
            const ServiceIcon = service.name.toLowerCase().includes('print') ? Printer
              : service.name.toLowerCase().includes('profil') || service.name.toLowerCase().includes('(kk)') ? UserCheck
                : FileText;

            return (
              <Reveal
                key={service.id}
                delay={index * 80}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row items-start justify-between gap-8"
              >
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0F2C59] dark:text-amber-400">
                      <ServiceIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                        {service.name}
                      </h2>
                      {service.tagline && (
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                          {service.tagline}
                        </p>
                      )}
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                      {service.description}
                    </p>
                  )}

                  {service.turnaroundTime && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg w-fit border border-slate-200 dark:border-slate-700">
                      <Clock className="w-3.5 h-3.5 text-[#0F2C59] dark:text-amber-400" />
                      <span>Processing Time: <strong className="text-slate-800 dark:text-slate-200">{service.turnaroundTime}</strong></span>
                    </div>
                  )}

                  {(service.eligibility.length > 0 || service.requirements.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                      {service.eligibility.length > 0 && (
                        <div className="bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">Eligibility</h3>
                          <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                            {service.eligibility.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-start gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {service.requirements.length > 0 && (
                        <div className="bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">Requirements</h3>
                          <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                            {service.requirements.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-start gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-[#0F2C59] dark:text-amber-400 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-full lg:w-64 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center flex flex-col justify-between shrink-0 space-y-4">
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Available Online
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Submit your request through the online application form.
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenApplyModal(service.name)}
                    className="w-full bg-[#F5A623] hover:bg-[#D98E16] text-[#081830] font-bold text-xs sm:text-sm py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Apply / Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
};
