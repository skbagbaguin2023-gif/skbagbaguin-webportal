import { CouncilMember } from '../types/index.ts';
import skcJean from '../assets/images/skcJean.jpg';
import skSecretary from '../assets/images/skSecretary.jpg';
import skTreasurer from '../assets/images/skTreasurer.jpg';
import skmRikki from '../assets/images/skmRikki.jpg';
import skmStanley from '../assets/images/skmStanley.jpg';
import skmLovely from '../assets/images/skmLovely.jpg';
import skmHazel from '../assets/images/skmHazel.jpg';
import skmTyra from '../assets/images/skmTyra.jpg';
import skmMelanie from '../assets/images/skmMelanie.jpg';
import skmPaula from '../assets/images/skmPaula.jpg';

export const DEFAULT_COUNCIL_MEMBERS: CouncilMember[] = [
  {
    id: 'sk-chairperson',
    name: 'Hon. Jean Marie Rose M. Perez',
    position: 'SK Chairperson',
    committee: 'Sangguniang Kabataan (SK) Chairperson',
    term: '2023-2028',
    bio: 'A dedicated public servant committed to empowering the youth and fostering positive change in the community. As the Sangguniang Kabataan (SK) Chairperson, she believes that the youth play an essential role in building a progressive, inclusive, and united society.',
    imageUrl: skcJean,
    motto: 'Serbisyo bago chismis, pero dapat updated sa both!',
  },
  {
    id: 'sk-member-melanie-arias',
    name: 'Hon. Melanie Clause Arias',
    position: 'SK Member',
    committee: 'Committee on Health, Health Services and Reproductive Health',
    term: '2023-2028',
    bio: 'Dedicated to promoting youth wellness through health education and accessible health services.',
    imageUrl: skmMelanie,
    motto: '',
  },
  {
    id: 'sk-member-lovely-castillo',
    name: 'Hon. Lovely Castillo',
    position: 'SK Member',
    committee: 'Committee on Education and Culture',
    term: '2023-2028',
    bio: 'Dedicated to promoting quality education and preserving cultural heritage.',
    imageUrl: skmLovely,
    motto: '',
  },
  {
    id: 'sk-member-tyra-dico',
    name: 'Hon. Tyra Althea Dico',
    position: 'SK Member',
    committee: 'Committee on Environmental Protection, Climate Change Adaptation, Disaster Risk Reduction and Resiliency',
    term: '2023-2028',
    bio: 'Committed to building a cleaner, greener, and safer community through environmental conservation.',
    imageUrl: skmTyra,
    motto: '',
  },
  {
    id: 'sk-member-rikki-bonifacio',
    name: 'Hon. Rikki Lou Bonifacio',
    position: 'SK Member',
    committee: 'Committee on Anti-Drug Abuse and Social Protection',
    term: '2023-2028',
    bio: 'Committed to protecting and guiding the youth through drug prevention and social awareness.',
    imageUrl: skmRikki,
    motto: '',
  },
  {
    id: 'sk-member-stanley-dela-cruz',
    name: 'Hon. Stanley Dela Cruz',
    position: 'SK Member',
    committee: 'Committee on Sports Development',
    term: '2023-2028',
    bio: 'Passionate about sports and youth engagement, supporting athletic competitions and recreational activities.',
    imageUrl: skmStanley,
    motto: '',
  },
  {
    id: 'sk-member-kathrina-aquino',
    name: 'Hon. Kathrina Paula Aquino',
    position: 'SK Member',
    committee: 'Livelihood Program',
    term: '2023-2028',
    bio: 'Passionate about empowering young people and promoting opportunities for skills development.',
    imageUrl: skmPaula,
    motto: '',
  },
  {
    id: 'sk-member-hazel-tasic',
    name: 'Hon. Hazel Tasic',
    position: 'SK Member',
    committee: 'Committee on Gender and Development',
    term: '2023-2028',
    bio: 'An advocate for equality and inclusivity, promoting equal opportunities and gender awareness.',
    imageUrl: skmHazel,
    motto: '',
  },
  {
    id: 'sk-treasurer-avellyn-alejo',
    name: 'Avellyn Alejo',
    position: 'SK Treasurer',
    committee: 'Treasury & Financial Management',
    term: '2023-2028',
    bio: 'Committed to transparency and accountability, the SK Treasurer oversees the proper management and documentation of council funds to ensure that resources are responsibly used for youth and community programs.',
    imageUrl: skTreasurer,
    motto: '',
  },
  {
    id: 'sk-secretary-ashley-demafelis',
    name: 'Ashley Demafelis',
    position: 'SK Secretary',
    committee: 'Secretariat & Kabataan ng Katipunan Records',
    term: '2023-2028',
    bio: 'Serving as the administrative backbone of the Sangguniang Kabataan, the SK Secretary maintains accurate records, prepares meeting minutes, and ensures that council activities are properly documented.',
    imageUrl: skSecretary,
    motto: '',
  },
];