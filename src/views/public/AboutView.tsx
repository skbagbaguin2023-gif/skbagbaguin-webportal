import React from 'react';
import { CouncilMember } from '../../types/index.ts';
import { 
  BookOpen, 
  Trophy, 
  Leaf, 
  HeartPulse, 
  Compass, 
  Mail,
  Phone,
  Award,
  CheckCircle,
  FileCheck
} from 'lucide-react';

interface AboutViewProps {
  council: CouncilMember[];
}

const getInitials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

export const AboutView: React.FC<AboutViewProps> = ({ council }) => {
  const chairperson = council.find((member) => /chairperson/i.test(member.position));
  const councilors = council.filter((member) => /member|councilor/i.test(member.position) && !/chairperson/i.test(member.position));
  const officers = council.filter((c) => c.position.includes('Secretary') || c.position.includes('Treasurer'));

  const pillars = [
    {
      title: 'Education & Academic Empowerment',
      icon: <BookOpen className="w-5 h-5 text-amber-500" />,
      desc: 'Expanding educational subsidies, free public e-library internet connectivity, and college entrance review assistance.',
    },
    {
      title: 'Sports & Grassroots Athletics',
      icon: <Trophy className="w-5 h-5 text-blue-500" />,
      desc: 'Inter-Sitio leagues, facility upgrades, and grassroots sports clinics that nurture discipline and deter youth substance abuse.',
    },
    {
      title: 'Environmental Protection & Climate Action',
      icon: <Leaf className="w-5 h-5 text-emerald-500" />,
      desc: 'Tullahan creek clean-ups, urban vertical agriculture, and disaster hazard mitigation for flood-prone Sitios.',
    },
    {
      title: 'Youth Health & Mental Well-being',
      icon: <HeartPulse className="w-5 h-5 text-rose-500" />,
      desc: 'Free HPV vaccinations, adolescent health check-ups, and stigma-free psychological first-aid consultations.',
    },
    {
      title: 'Civic Leadership & Digital Livelihood',
      icon: <Compass className="w-5 h-5 text-purple-500" />,
      desc: 'Tech freelancing bootcamps, Katipunan ng Kabataan general assemblies, and participatory youth budgeting.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
      
      {/* 1. Header Banner */}
      <div className="bg-[#0F2C59] text-white rounded-2xl p-8 sm:p-12 border border-navy-800 shadow-md">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-white/10 px-3 py-1 rounded-full">
            <span>Republic Act No. 10742</span>
            <span>·</span>
            <span>Sangguniang Kabataan ng Barangay Bagbaguin</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tapat na Pamumuno, Maaasahang Serbisyo Para sa Kabataan
          </h1>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            Council information and official records will be published here when available.
          </p>
        </div>
      </div>

      {/* 2. Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ang Aming Misyon (Mission)</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Maghatid ng transparent, may integridad, at maka-kabataang pamamahala sa pamamagitan ng pantay na edukasyon, programang pampalakasan, proteksyon sa kalikasan, at paghubog sa liderato ng bawat kabataang Bagbagueno.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F2C59]/10 dark:bg-sky-950/50 text-[#0F2C59] dark:text-sky-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ang Aming Bisyon (Vision)</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Isang maunlad, nagkakaisa, at makakalikasang Barangay Bagbaguin kung saan ang bawat kabataan ay may boses sa pamamahala, may kakayahang magtagumpay sa pag-aaral at hanapbuhay, at aktibong katuwang sa kaunlaran ng Lungsod ng Valenzuela.
          </p>
        </div>
      </div>

      {/* 3. Core Pillars */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Limang Haligi ng Paglilingkod (Core Pillars)</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Guided by the Comprehensive Barangay Youth Development Plan (CBYDP)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {pillars.map((pillar, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 w-fit mb-3">
                  {pillar.icon}
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-2 leading-tight">
                  {pillar.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Organizational Chart & Council Directory */}
      <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">SK Council Directory</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">SK council officials</p>
        </div>

        {chairperson && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-400 p-6 sm:p-8 shadow-md">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-amber-400 shadow-sm shrink-0">
                {chairperson.imageUrl ? (
                  <img src={chairperson.imageUrl} alt={chairperson.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#0F2C59] text-amber-400 text-xl font-bold">{getInitials(chairperson.name)}</div>
                )}
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <div className="inline-block bg-[#0F2C59] dark:bg-slate-800 text-amber-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {chairperson.position}
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{chairperson.name}</h3>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {chairperson.committee} · Term: {chairperson.term}
                </p>
                {chairperson.bio && <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">{chairperson.bio}</p>}
                {chairperson.motto && <p className="text-xs font-medium text-amber-700 dark:text-amber-400 italic">{chairperson.motto}</p>}
              </div>
              {(chairperson.email || chairperson.contact) && (
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 text-left shrink-0 max-w-full">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Official Contact</div>
                  {chairperson.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 shrink-0" /><span className="font-mono text-[11px] break-all">{chairperson.email}</span></div>}
                  {chairperson.contact && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" /><span className="font-mono text-[11px]">{chairperson.contact}</span></div>}
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Mga Kagawad ng Sangguniang Kabataan (SK Councilors)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {councilors.length === 0 ? <p className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-sm text-slate-500 dark:text-slate-400">Council profiles will appear here once added.</p> : councilors.map((c) => (
              <div key={c.id} className="min-h-[320px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col items-center text-center">
                <div className="flex-1 w-full">
                  <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-slate-100 dark:bg-slate-800 mb-4 border-2 border-slate-200 dark:border-slate-700">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#0F2C59] text-amber-400 text-lg font-bold">{getInitials(c.name)}</div>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h3>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{c.position}</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">{c.committee}</p>
                  {c.bio && <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-3 leading-relaxed">{c.bio}</p>}
                </div>
                {(c.email || c.contact) && <div className="w-full pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 space-y-1 text-left">
                  {c.email && <div className="truncate">Email: {c.email}</div>}
                  {c.contact && <div>Contact: {c.contact}</div>}
                </div>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Secretariat & Piskalya (Appointed Officers)</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {officers.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">Appointed officers will appear here once added.</p> : officers.map((o) => (
              <div key={o.id} className="min-h-32 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                  {o.imageUrl ? (
                    <img src={o.imageUrl} alt={o.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#0F2C59] text-amber-400 font-bold">{getInitials(o.name)}</div>
                  )}
                </div>
                <div className="space-y-0.5 text-xs">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{o.name}</h4>
                  <p className="font-semibold text-amber-600 dark:text-amber-400">{o.position}</p>
                  <p className="text-slate-500 dark:text-slate-400">{o.committee}</p>
                  {o.bio && <p className="text-slate-600 dark:text-slate-300 mt-1">{o.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. Youth Development Plan Overview */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-[#0F2C59] dark:text-amber-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Comprehensive Barangay Youth Development Plan
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Official youth development plan details have not been added yet.
        </p>
      </div>

    </div>
  );
};
