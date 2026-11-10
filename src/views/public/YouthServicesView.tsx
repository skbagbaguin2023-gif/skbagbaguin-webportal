import React from 'react';
import { ArrowRight, CheckCircle, Clock, FileText, Printer, Sparkles, UserCheck } from 'lucide-react';
import type { YouthService } from '../../types/index.ts';
import Reveal from '../../components/Reveal.jsx';

interface YouthServicesViewProps {
  services: YouthService[];
  onOpenApplyModal: (service?: string) => void;
  onCheckKkRegistration: () => void;
}

export const YouthServicesView: React.FC<YouthServicesViewProps> = ({
  services,
  onOpenApplyModal,
  onCheckKkRegistration,
}) => {
  const activeServices = services.filter((service) => service.isActive);
  const serviceCardTheme = {
    card: 'border-[#0F2C59] bg-gradient-to-br from-[#173B72] to-[#081830] text-white',
    badge: 'border-amber-300/40 bg-amber-400/15 text-amber-300',
    number: 'text-amber-300/75',
    kicker: 'text-amber-300',
    title: 'text-white',
    description: 'text-slate-200',
    detail: 'border-white/15 bg-white/10 text-white',
    detailTitle: 'text-amber-300',
    detailCopy: 'text-white/90',
    detailIcon: 'text-amber-300',
    button: 'bg-[#F5A623] text-[#081830] hover:bg-[#FFC04D] focus-visible:outline-[#F5A623]',
  };

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-5">
          {activeServices.map((service, index) => {
            const ServiceIcon = service.name.toLowerCase().includes('print') ? Printer
              : service.name.toLowerCase().includes('profil') || service.name.toLowerCase().includes('(kk)') ? UserCheck
                : FileText;
            const theme = serviceCardTheme;

            return (
              <Reveal
                key={service.id}
                delay={index * 80}
                className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-6 ${theme.card}`}
              >
                <ServiceIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-3 top-5 h-28 w-28 rotate-[-12deg] opacity-[0.12] transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105 sm:h-36 sm:w-36"
                />
                <div className="relative flex items-start justify-between">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${theme.badge}`}>
                    <ServiceIcon className="h-5 w-5" />
                  </span>
                  <span className={`pt-1 text-[11px] font-bold tracking-[0.18em] ${theme.number}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="relative mt-5">
                  <p className={`line-clamp-1 text-[11px] font-semibold ${theme.kicker}`}>
                    {service.tagline || 'Available Youth Service'}
                  </p>
                  <h2 className={`mt-2 text-xl font-extrabold leading-tight sm:text-2xl ${theme.title}`}>
                    {service.name}
                  </h2>
                  {service.description && (
                    <p className={`mt-2 text-sm leading-relaxed ${theme.description}`}>
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="relative mt-5 flex flex-1 flex-col gap-3">
                  {service.turnaroundTime && (
                    <div className={`flex items-start gap-2.5 rounded-xl border p-3 ${theme.detail}`}>
                      <Clock className={`mt-0.5 h-4 w-4 shrink-0 ${theme.detailIcon}`} />
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.detailTitle}`}>
                          Processing Time
                        </p>
                        <p className={`mt-0.5 text-xs leading-relaxed ${theme.detailCopy}`}>
                          {service.turnaroundTime}
                        </p>
                      </div>
                    </div>
                  )}

                  {(service.eligibility.length > 0 || service.requirements.length > 0) && (
                    <div className="grid grid-cols-1 gap-3">
                      {service.eligibility.length > 0 && (
                        <div className={`rounded-xl border p-3 ${theme.detail}`}>
                          <h3 className={`text-[10px] font-bold uppercase tracking-wider ${theme.detailTitle}`}>
                            Eligibility
                          </h3>
                          <ul className={`mt-2 space-y-1.5 text-xs leading-relaxed ${theme.detailCopy}`}>
                            {service.eligibility.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-start gap-1.5">
                                <CheckCircle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${theme.detailIcon}`} />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {service.requirements.length > 0 && (
                        <div className={`rounded-xl border p-3 ${theme.detail}`}>
                          <h3 className={`text-[10px] font-bold uppercase tracking-wider ${theme.detailTitle}`}>
                            Requirements
                          </h3>
                          <ul className={`mt-2 space-y-1.5 text-xs leading-relaxed ${theme.detailCopy}`}>
                            {service.requirements.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-start gap-1.5">
                                <CheckCircle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${theme.detailIcon}`} />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={`relative mt-5 rounded-xl border p-3 ${theme.detail}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.detailTitle}`}>
                    Available Online
                  </p>
                  <p className={`mt-1 text-xs leading-relaxed ${theme.detailCopy}`}>
                    Submit your request through the online application form.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenApplyModal(service.name)}
                  className={`relative mt-3 flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${theme.button}`}
                >
                  <span>Apply / Request</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </button>
                {service.name.toLowerCase().includes('profil') && (
                  <button
                    type="button"
                    onClick={onCheckKkRegistration}
                    className="relative mt-2 w-full rounded-xl border border-white/30 px-4 py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                  >
                    Check my registration / Suriin ang aking rehistro
                  </button>
                )}
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
};
