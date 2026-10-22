import React from 'react';
import { ServiceType } from '../../types/index.ts';
import { 
  GraduationCap, 
  UserCheck, 
  Building2, 
  MessageSquareWarning, 
  FileCheck2, 
  CheckCircle, 
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles
} from 'lucide-react';

interface YouthServicesViewProps {
  onOpenApplyModal: (service?: ServiceType) => void;
}

export const YouthServicesView: React.FC<YouthServicesViewProps> = ({ onOpenApplyModal }) => {
  const services: {
    type: ServiceType;
    title: string;
    icon: React.ReactNode;
    tagline: string;
    description: string;
    turnaroundTime: string;
    eligibility: string[];
    requirements: string[];
  }[] = [
    {
      type: 'Educational Assistance',
      title: 'Lingkod Kabataan Educational Cash Assistance',
      icon: <GraduationCap className="w-6 h-6 text-amber-500" />,
      tagline: 'Official service details have not been added yet.',
      description: 'Program information will be published when official details are available.',
      turnaroundTime: 'Not provided',
      eligibility: [],
      requirements: [],
    },
    {
      type: 'Youth Profiling & Katipunan ng Kabataan Registration',
      title: 'Katipunan ng Kabataan (KK) Official Profiling',
      icon: <UserCheck className="w-6 h-6 text-blue-500" />,
      tagline: 'Official service details have not been added yet.',
      description: 'Registration information will be published when official details are available.',
      turnaroundTime: 'Not provided',
      eligibility: [],
      requirements: [],
    },
    {
      type: 'SK Facility / Equipment Booking',
      title: 'SK Covered Court & Sound System Reservation',
      icon: <Building2 className="w-6 h-6 text-emerald-500" />,
      tagline: 'Official service details have not been added yet.',
      description: 'Facility information will be published when official details are available.',
      turnaroundTime: 'Not provided',
      eligibility: [],
      requirements: [],
    },
    {
      type: 'Youth Concern & Suggestion',
      title: 'Youth Grievance & Community Suggestion Box',
      icon: <MessageSquareWarning className="w-6 h-6 text-rose-500" />,
      tagline: 'Official service details have not been added yet.',
      description: 'Service information will be published when official details are available.',
      turnaroundTime: 'Not provided',
      eligibility: [],
      requirements: [],
    },
    {
      type: 'SK Barangay Endorsement',
      title: 'Official SK Council Endorsement & Recommendation',
      icon: <FileCheck2 className="w-6 h-6 text-purple-500" />,
      tagline: 'Official service details have not been added yet.',
      description: 'Service information will be published when official details are available.',
      turnaroundTime: 'Not provided',
      eligibility: [],
      requirements: [],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Banner */}
      <div className="bg-[#0F2C59] text-white rounded-2xl p-6 sm:p-10 border border-navy-800 shadow-md">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-white/10 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>e-Services Citizen's Charter</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Youth Services & Online Application Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Service descriptions will appear here after official information is added.
          </p>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-6">
        {services.map((svc, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col lg:flex-row items-start justify-between gap-8"
          >
            {/* Left Description */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                  {svc.icon}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                    {svc.title}
                  </h2>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">{svc.tagline}</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                {svc.description}
              </p>

              {svc.turnaroundTime !== 'Not provided' && <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg w-fit border border-slate-200 dark:border-slate-700">
                <Clock className="w-3.5 h-3.5 text-[#0F2C59] dark:text-amber-400" />
                <span>Processing Time: <strong className="text-slate-800 dark:text-slate-200">{svc.turnaroundTime}</strong></span>
              </div>}

              {/* Two Column Requirements & Eligibility */}
              {(svc.eligibility.length > 0 || svc.requirements.length > 0) && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                    Sino ang Kwalipikado? (Eligibility)
                  </h3>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                    {svc.eligibility.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                    Mga Kakailanganing Dokumento (Checklist)
                  </h3>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                    {svc.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#0F2C59] dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>}

            </div>

            {/* Right Action CTA Card */}
            <div className="w-full lg:w-64 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center flex flex-col justify-between shrink-0 space-y-4">
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Available Online
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Ready to apply? Complete our online submission form in minutes.
                </div>
              </div>

              <button
                onClick={() => onOpenApplyModal(svc.type)}
                className="w-full bg-[#F5A623] hover:bg-[#D98E16] text-[#081830] font-bold text-xs sm:text-sm py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Apply / Register Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                Data Privacy Act of 2012 Certified
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
