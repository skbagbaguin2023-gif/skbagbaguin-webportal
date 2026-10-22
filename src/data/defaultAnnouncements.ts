import { Announcement } from '../types/index.ts';
import announceImg1 from '../assets/images/announceImg1.jpg';
import announceImg2 from '../assets/images/announceImg2.jpg';

// TODO: Paste the direct Facebook post URL for the KK Profiling announcement here.
const KK_PROFILING_SOURCE_POST_URL = 'https://web.facebook.com/share/p/1DyAVLvYHv/';
const NEGOSYO_KART_SOURCE_POST_URL = 'https://web.facebook.com/share/p/1EZ5xmFTcY/';

export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'sk-negosyo-kart-2026',
    title: 'SK BAGBAGUIN 2023 | SK NEGOSYO KART',
    excerpt: 'Narito ang listahan ng mga pangalan ng mga taong nagsumite at nagsagot ng aming nilabas na Google Form. Inaanyayahan po namin ang lahat ng nasa listahan na magpasa ng mga kailangang ipasa sa amin.',
    content: `Narito ang listahan ng mga pangalan ng mga taong nagsumite at nagsagot ng aming nilabas na Google Form.

Inaanyayahan po namin ang lahat ng nasa listahan na magpasa ng mga kailangang ipasa sa amin.

MGA REQUIREMENTS
• Accomplished SK Negosyo Kart Application Form
• Photocopy ng Updated Voter’s Certification
• Photocopy ng Valid ID
• Barangay Certificate of Indigency (PURPOSE: SK BAGBAGUIN NEGOSYO KART)
• Katibayan na ikaw ay isang Out-of-School Youth
• Katibayang may kapansanan (Person with Disability / PWD)

PAALALA: Kapag maraming nag-apply at nakapasa sa assessment sa isang sitio, pagsasamahin sa isang raffle draw ang mga nakatira sa sitio na iyon at isa lamang sa sitio na iyon ang magkakaroon ng SK Negosyo Kart.

Mula sa lahat ng kwalipikadong aplikante, Limang (5) kabataan ang random na mapipili bilang benepisyaryo ng SK Negosyo Kart.

Tanging mga aplikanteng nakapasa sa qualifications, assessment, at nakapag-submit ng kumpletong requirements ang maisasama sa raffle.

#SKBagbaguin2023
#TuloyAngTapatAtProgresibongSerbisyo
#SKNegosyoKart

Schedule: October 21, 2026, 3:00 PM–5:00 PM
Venue: 4th Floor, SK Bagbaguin Office, Sitio Malinis Multi-Purpose Building`,
    category: 'General Notice',
    author: 'SK Bagbaguin 2023',
    date: '2026-10-19',
    status: 'Published',
    isPinned: true,
    coverImage: announceImg1,
    sourcePostUrl: NEGOSYO_KART_SOURCE_POST_URL,
  },
  {
    id: 'kk-profiling-2024',
    title: 'MAKIISA KABATAAN!!! – KATIPUNAN NG KABATAAN PROFILING',
    excerpt: 'Para sa mga kabataang botante, hindi pa botante, o residente ng Barangay Bagbaguin, Valenzuela City: magparehistro para sa Katipunan ng Kabataan (KK) Profiling.',
    content: `ANO ANG KK PROFILING?

Ang KK Profiling ay pagtatala ng impormasyon tungkol sa mga miyembro ng Katipunan ng Kabataan. Isinasagawa ito alinsunod sa RA No. 10742 at sa mga patakaran ng Department of the Interior and Local Government (DILG) at National Youth Commission (NYC).

SINO ANG KATIPUNAN NG KABATAAN?

Mga mamamayan na may edad 15 hanggang 30 taong gulang na botante o nakatira sa barangay, sa loob ng anim na buwan.

PAANO MAGPAREHISTRO?

1. Buksan ang registration link na inilathala sa orihinal na post o i-scan ang QR code.
2. Sagutan ang lahat ng kinakailangang impormasyon.
3. Pindutin ang SUBMIT kapag tapos na ang registration.

Ang registration period na nakasaad sa orihinal na anunsyo ay Pebrero 28 hanggang Marso 27, 2024.

PAALALA

Ang lahat ng impormasyong ibibigay ay mananatiling kumpidensyal alinsunod sa Data Privacy Act of 2012.

#MAKIISASAPROGRESO
#SKBAGBAGUIN2024
#TuloyAngProgresoValenzuela`,
    category: 'Youth Assemblies',
    author: 'SK Bagbaguin Valenzuela',
    date: '2024-02-28',
    status: 'Published',
    coverImage: announceImg2,
    sourcePostUrl: KK_PROFILING_SOURCE_POST_URL,
  },
];
