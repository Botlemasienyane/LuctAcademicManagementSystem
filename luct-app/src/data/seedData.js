// ============================================================
// LUCT SEED DATA — sourced from faculty structures + timetable
// ============================================================

// Main sample data used by the app.
// This covers faculties, staff, classes, courses, and demo users from the brief.
export const FACULTIES = [
  {
    id: 'FICT',
    name: 'Faculty of Information and Communication Technology',
    shortName: 'FICT',
    fmg: { name: 'Mrs. Diana Moopisa', role: 'FMG', email: 'diana.moopisa@limkokwing.ac.ls' },
    pls: [
      { id: 'pl_kapela', name: 'Mr. Kapela Morutwa', role: 'PL', email: 'kapela.morutwa@limkokwing.ac.ls' },
      { id: 'pl_tsietsi', name: 'Mr. Tsietsi Matjele', role: 'PL', email: 'tsietsi.matjele@limkokwing.ac.ls' },
    ],
    prls: [
      { id: 'prl_mpotla', name: 'Mr. Mpotla Nthunya', role: 'PRL', email: 'mpotla.nthunya@limkokwing.ac.ls', pl: 'pl_kapela' },
      { id: 'prl_khauhelo', name: 'Ms. Khauhelo Mahlakeng', role: 'PRL', email: 'khauhelo.mahlakeng@limkokwing.ac.ls', pl: 'pl_kapela' },
      { id: 'prl_takura', name: 'Mr. Takura Bhila', role: 'PRL', email: 'takura.bhila@limkokwing.ac.ls', pl: 'pl_tsietsi' },
      { id: 'prl_batloung', name: 'Mr. Batloung Hlabeli', role: 'PRL', email: 'batloung.hlabeli@limkokwing.ac.ls', pl: 'pl_tsietsi' },
    ],
    yls: [
      { id: 'yl_palesa', name: 'Ms. Palesa Ntho', role: 'YL', email: 'palesa.ntho@limkokwing.ac.ls', prl: 'prl_mpotla' },
      { id: 'yl_mabafokeng', name: 'Mrs. Mabafokeng Mokete', role: 'YL', email: 'mabafokeng.mokete@limkokwing.ac.ls', prl: 'prl_khauhelo' },
      { id: 'yl_makamohelo_mathe', name: 'Mrs. Makamohelo Mathe', role: 'YL', email: 'makamohelo.mathe@limkokwing.ac.ls', prl: 'prl_takura' },
      { id: 'yl_uduak', name: 'Ms. Uduak Ebisoh', role: 'YL', email: 'uduak.ebisoh@limkokwing.ac.ls', prl: 'prl_batloung' },
    ],
    programmes: [
      { id: 'BSCITY', name: 'Bachelor of Science in Information Technology', years: 4 },
      { id: 'BSCBITY', name: 'Bachelor of Science in Computer & Business Information Technology', years: 4 },
      { id: 'BSCSMY', name: 'Bachelor of Science in Software Engineering with Multimedia', years: 4 },
      { id: 'DITY', name: 'Diploma in Information Technology', years: 2 },
      { id: 'DBITY', name: 'Diploma in Computer & Business Information Technology', years: 2 },
      { id: 'DMSEY', name: 'Diploma in Software Engineering with Multimedia', years: 2 },
      { id: 'CBITY', name: 'Certificate in Business Information Technology', years: 1 },
    ],
  },
  {
    id: 'FDI',
    name: 'Faculty of Design Innovation',
    shortName: 'FDI',
    fmg: { name: "Mr. Molemo Ts'oeu", role: 'FMG', email: 'molemo.tsoeu@limkokwing.ac.ls' },
    pls: [
      { id: 'pl_maseabata', name: 'Mrs. Maseabata Telite', role: 'PL', email: 'maseabata.telite@limkokwing.ac.ls' },
      { id: 'pl_makamohelo_liname', name: 'Mrs. Makamohelo Liname', role: 'PL', email: 'makamohelo.liname@limkokwing.ac.ls' },
    ],
    prls: [
      { id: 'prl_reauboka', name: 'Mr. Reauboka Mphale', role: 'PRL', email: 'reauboka.mphale@limkokwing.ac.ls', pl: 'pl_maseabata' },
      { id: 'prl_thapelo_sebotsa', name: 'Mr. Thapelo Sebotsa', role: 'PRL', email: 'thapelo.sebotsa@limkokwing.ac.ls', pl: 'pl_maseabata' },
      { id: 'prl_maili', name: 'Ms. Maili Moorosi', role: 'PRL', email: 'maili.moorosi@limkokwing.ac.ls', pl: 'pl_makamohelo_liname' },
    ],
    yls: [
      { id: 'yl_itumeleng_martins', name: 'Ms. Itumeleng Martins', role: 'YL', email: 'itumeleng.martins@limkokwing.ac.ls', prl: 'prl_reauboka' },
      { id: 'yl_mphore', name: 'Mr. Mphore Mapena', role: 'YL', email: 'mphore.mapena@limkokwing.ac.ls', prl: 'prl_thapelo_sebotsa' },
      { id: 'yl_tholoana', name: 'Mrs. Tholoana Ntuli', role: 'YL', email: 'tholoana.ntuli@limkokwing.ac.ls', prl: 'prl_maili' },
    ],
    programmes: [
      { id: 'DBRTVY', name: 'Diploma in Broadcasting, Radio, TV & Video', years: 2 },
      { id: 'DJMY', name: 'Diploma in Journalism & Media', years: 2 },
      { id: 'DBMY', name: 'Diploma in Business Management', years: 2 },
    ],
  },
  {
    id: 'FBMG',
    name: 'Faculty of Business and Globalization',
    shortName: 'FBMG',
    fmg: { name: 'Mr. Hlabathe Posholi', role: 'FMG', email: 'hlabathe.posholi@limkokwing.ac.ls' },
    pls: [
      { id: 'pl_khopotso', name: 'Ms. Khopotso Molati', role: 'PL', email: 'khopotso.molati@limkokwing.ac.ls' },
      { id: 'pl_kelebone', name: 'Adv. Kelebone Fosa', role: 'PL', email: 'kelebone.fosa@limkokwing.ac.ls' },
    ],
    prls: [
      { id: 'prl_makatleho', name: 'Mrs. Makatleho Mafura', role: 'PRL', email: 'makatleho.mafura@limkokwing.ac.ls', pl: 'pl_khopotso' },
      { id: 'prl_joalane', name: 'Ms. Joalane Putsoa', role: 'PRL', email: 'joalane.putsoa@limkokwing.ac.ls', pl: 'pl_khopotso' },
      { id: 'prl_mamello', name: 'Ms. Mamello Mahlomola', role: 'PRL', email: 'mamello.mahlomola@limkokwing.ac.ls', pl: 'pl_kelebone' },
      { id: 'prl_likeleko', name: 'Ms. Likeleko Damane', role: 'PRL', email: 'likeleko.damane@limkokwing.ac.ls', pl: 'pl_kelebone' },
      { id: 'prl_motsabi', name: 'Ms. Motsabi Korotsoane', role: 'PRL', email: 'motsabi.korotsoane@limkokwing.ac.ls', pl: 'pl_kelebone' },
    ],
    yls: [
      { id: 'yl_rethabile', name: 'Mr. Rethabile Maekane', role: 'YL', email: 'rethabile.maekane@limkokwing.ac.ls', prl: 'prl_makatleho' },
      { id: 'yl_thabiso', name: 'Mr. Thabiso Molise', role: 'YL', email: 'thabiso.molise@limkokwing.ac.ls', prl: 'prl_joalane' },
      { id: 'yl_matseliso', name: 'Ms. Matseliso Morahanye', role: 'YL', email: 'matseliso.morahanye@limkokwing.ac.ls', prl: 'prl_mamello' },
      { id: 'yl_lena', name: 'Ms. Lena Jaase', role: 'YL', email: 'lena.jaase@limkokwing.ac.ls', prl: 'prl_motsabi' },
    ],
    programmes: [
      { id: 'BAHRY', name: 'Bachelor of Arts in Human Resource Management', years: 3 },
      { id: 'BBJY', name: 'Bachelor of Business Administration', years: 3 },
      { id: 'BPCY', name: 'Bachelor of Professional Communication', years: 3 },
      { id: 'BSBTY', name: 'Bachelor of Science in Business Technology', years: 4 },
      { id: 'BTMY', name: 'Bachelor of Tourism Management', years: 3 },
    ],
  },
  {
    id: 'FABE',
    name: 'Faculty of Architecture and the Built Environment',
    shortName: 'FABE',
    fmg: { name: 'Mr. Ramohlaboli Khotle', role: 'FMG', email: 'ramohlaboli.khotle@limkokwing.ac.ls' },
    pls: [
      { id: 'pl_arabang', name: 'Mr. Arabang Maama', role: 'PL', email: 'arabang.maama@limkokwing.ac.ls' },
    ],
    prls: [
      { id: 'prl_mapallo', name: 'Ms. Mapallo Monoko', role: 'PRL', email: 'mapallo.monoko@limkokwing.ac.ls', pl: 'pl_arabang' },
      { id: 'prl_teboho_ntsaba', name: 'Mr. Teboho Ntsaba', role: 'PRL', email: 'teboho.ntsaba@limkokwing.ac.ls', pl: 'pl_arabang' },
    ],
    yls: [
      { id: 'yl_boikoko', name: 'Ms. Boikokobetso Mohlomi', role: 'YL', email: 'boikokobetso.mohlomi@limkokwing.ac.ls', prl: 'prl_teboho_ntsaba' },
    ],
    programmes: [
      { id: 'DATY', name: 'Diploma in Architectural Technology', years: 2 },
    ],
  },
  {
    id: 'FCMB',
    name: 'Faculty of Communication, Media and Broadcasting',
    shortName: 'FCMB',
    fmg: { name: 'Mrs. Papiso Brown', role: 'FMG', email: 'papiso.brown@limkokwing.ac.ls' },
    pls: [
      { id: 'pl_nketsi', name: 'Dr. Nketsi Moqasa', role: 'PL', email: 'nketsi.moqasa@limkokwing.ac.ls' },
      { id: 'pl_itumeleng_sekhamane', name: 'Ms. Itumeleng Sekhamane', role: 'PL', email: 'itumeleng.sekhamane@limkokwing.ac.ls' },
    ],
    prls: [
      { id: 'prl_tsepiso', name: 'Ms. Tsepiso Mncina', role: 'PRL', email: 'tsepiso.mncina@limkokwing.ac.ls', pl: 'pl_nketsi' },
      { id: 'prl_teboho_mokonyana', name: 'Mr. Teboho Mokonyana', role: 'PRL', email: 'teboho.mokonyana@limkokwing.ac.ls', pl: 'pl_nketsi' },
      { id: 'prl_mpaki', name: 'Mr. Mpaki Molapo', role: 'PRL', email: 'mpaki.molapo@limkokwing.ac.ls', pl: 'pl_itumeleng_sekhamane' },
      { id: 'prl_thapelo_lebona', name: 'Mr. Thapelo Lebona', role: 'PRL', email: 'thapelo.lebona@limkokwing.ac.ls', pl: 'pl_itumeleng_sekhamane' },
    ],
    yls: [
      { id: 'yl_pusetso', name: 'Mr. Pusetso Mopeli', role: 'YL', email: 'pusetso.mopeli@limkokwing.ac.ls', prl: 'prl_tsepiso' },
      { id: 'yl_lijeng', name: 'Ms. Lijeng Ranooe', role: 'YL', email: 'lijeng.ranooe@limkokwing.ac.ls', prl: 'prl_teboho_mokonyana' },
      { id: 'yl_morapeli', name: 'Mr. Morapeli Moseme', role: 'YL', email: 'morapeli.moseme@limkokwing.ac.ls', prl: 'prl_mpaki' },
      { id: 'yl_nkopane', name: 'Mr. Nkopane Mokuena', role: 'YL', email: 'nkopane.mokuena@limkokwing.ac.ls', prl: 'prl_thapelo_lebona' },
    ],
    programmes: [
      { id: 'DPCY', name: 'Degree in Professional Communication', years: 3 },
      { id: 'DBJY', name: 'Degree in Broadcasting & Journalism', years: 3 },
      { id: 'DTVF', name: 'Diploma in Television and Film Production', years: 2 },
      { id: 'DBRTV', name: 'Diploma in Broadcasting (Radio and TV)', years: 2 },
      { id: 'DPR', name: 'Diploma in Public Relations', years: 2 },
      { id: 'DJM', name: 'Diploma in Journalism and Media', years: 2 },
    ],
  },
  {
    id: 'FCTH',
    name: 'Faculty of Creativity in Tourism and Hospitality',
    shortName: 'FCTH',
    fmg: { name: 'Mr. Sebinane Lekoekoe', role: 'FMG', email: 'sebinane.lekoekoe@limkokwing.ac.ls' },
    pls: [
      { id: 'pl_maletela', name: 'Ms. Maletela Lehlaha', role: 'PL', email: 'maletela.lehlaha@limkokwing.ac.ls' },
      { id: 'pl_kagiso', name: 'Mr. Kagiso Ikanyeng', role: 'PL', email: 'kagiso.ikanyeng@limkokwing.ac.ls' },
    ],
    prls: [
      { id: 'prl_lieketseng', name: 'Ms. Lieketseng Maketela', role: 'PRL', email: 'lieketseng.maketela@limkokwing.ac.ls', pl: 'pl_maletela' },
      { id: 'prl_tsepang', name: 'Ms. Tsepang Mahula', role: 'PRL', email: 'tsepang.mahula@limkokwing.ac.ls', pl: 'pl_maletela' },
      { id: 'prl_ngonidzashe', name: 'Dr. Ngonidzashe Makwindi', role: 'PRL', email: 'ngonidzashe.makwindi@limkokwing.ac.ls', pl: 'pl_kagiso' },
    ],
    yls: [
      { id: 'yl_renang', name: 'Mr. Renang Commando', role: 'YL', email: 'renang.commando@limkokwing.ac.ls', prl: 'prl_lieketseng' },
      { id: 'yl_makarabo', name: 'Mrs. Makarabo Lehoko', role: 'YL', email: 'makarabo.lehoko@limkokwing.ac.ls', prl: 'prl_tsepang' },
      { id: 'yl_liopelo', name: 'Ms. Liopelo Mohapi', role: 'YL', email: 'liopelo.mohapi@limkokwing.ac.ls', prl: 'prl_ngonidzashe' },
    ],
    programmes: [
      { id: 'DTM', name: 'Degree in Tourism Management', years: 3 },
      { id: 'DITM', name: 'Diploma in Tourism Management', years: 2 },
      { id: 'DIHM', name: 'Diploma in Hotel Management', years: 2 },
      { id: 'DIEM', name: 'Diploma in Events Management', years: 2 },
    ],
  },
];

// Sample lecturers used in the lecturer and course screens.
export const LECTURERS = [
  { id: 'lec_tsekiso', name: 'Tsekiso Thokoana', email: 'tsekiso.thokoana@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_kapela', name: 'Kapela Morutwa', email: 'kapela.morutwa@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_mpotla', name: 'Mpotla Nthunya', email: 'mpotla.nthunya@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_khauhelo', name: 'Khauhelo Mahlakeng', email: 'khauhelo.mahlakeng@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_takura', name: 'Takura Bhila', email: 'takura.bhila@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_batloung', name: 'Hlabeli Batloung', email: 'hlabeli.batloung@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_palesa', name: 'Palesa Ntho', email: 'palesa.ntho@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_uduak', name: 'Uduak Imo Ebisoh', email: 'uduak.ebisoh@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_liteboho', name: 'Liteboho Molaoa', email: 'liteboho.molaoa@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_tsepo', name: 'Tsepo Mofolo', email: 'tsepo.mofolo@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_nthatisi', name: 'Nthatisi Monakalali', email: 'nthatisi.monakalali@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_motobatsi', name: 'Motobatsi Maseli', email: 'motobatsi.maseli@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_molemo_borotho', name: 'Molemo Borotho', email: 'molemo.borotho@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_mohale', name: 'Mohale Tlali', email: 'mohale.tlali@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_manapo', name: 'Manapo Sekopo', email: 'manapo.sekopo@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_thato', name: 'Thato Makheka', email: 'thato.makheka@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_tsietsi', name: 'Tsietsi Matjele', email: 'tsietsi.matjele@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_khauta', name: 'Khauta Rantai', email: 'khauta.rantai@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_mpho', name: 'Mpho Takalimane', email: 'mpho.takalimane@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_makhaola', name: 'Makhaola Kuena', email: 'makhaola.kuena@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_tseliso', name: 'Tseliso Moorosi', email: 'tseliso.moorosi@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_khauhelo_mahlakeng', name: 'Khauhelo Mahlakeng', email: 'khauhelo.mahlakeng@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_itumeleng_m', name: 'Itumeleng Mokhachane', email: 'itumeleng.mokhachane@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_mamolapi', name: 'Mamolapi Serutla', email: 'mamolapi.serutla@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_ntsejoa', name: 'Ntsejoa Ranyali', email: 'ntsejoa.ranyali@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_mantsebo', name: 'Mantsebo Molapo', email: 'mantsebo.molapo@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_masechaba', name: 'Masechaba Sechaba', email: 'masechaba.sechaba@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_khauhelo2', name: 'Khauhelo Mahlakeng', email: 'khauhelo2.mahlakeng@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_diana', name: 'Diana Moopisa', email: 'diana.moopisa@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_makatleho', name: 'Makatleho Mafura', email: 'makatleho.mafura@limkokwing.ac.ls', faculty: 'FBMG' },
  { id: 'lec_thabo', name: 'Thabo Noosi', email: 'thabo.noosi@limkokwing.ac.ls', faculty: 'FICT' },
  { id: 'lec_daniel', name: 'Daniel Matebesi', email: 'daniel.matebesi@limkokwing.ac.ls', faculty: 'FICT' },
];

// Classes used for report, attendance, and course records.
export const CLASSES = [
  // FICT BSc IT
  { id: 'cls_bscity1', code: 'BSCITY1S2', name: 'BSc IT Year 1 Sem 2', programme: 'BSCITY', year: 1, faculty: 'FICT', totalStudents: 35 },
  { id: 'cls_bscity2', code: 'BSCITY2S2', name: 'BSc IT Year 2 Sem 2', programme: 'BSCITY', year: 2, faculty: 'FICT', totalStudents: 28 },
  { id: 'cls_bscity3', code: 'BSCITY3S2', name: 'BSc IT Year 3 Sem 2', programme: 'BSCITY', year: 3, faculty: 'FICT', totalStudents: 22 },
  { id: 'cls_bscity4', code: 'BSCITY4S2', name: 'BSc IT Year 4 Sem 2', programme: 'BSCITY', year: 4, faculty: 'FICT', totalStudents: 18 },
  // FICT BSc CBIT
  { id: 'cls_bscbity1', code: 'BSCBITY1S2', name: 'BSc CBIT Year 1 Sem 2', programme: 'BSCBITY', year: 1, faculty: 'FICT', totalStudents: 40 },
  { id: 'cls_bscbity2', code: 'BSCBITY2S2', name: 'BSc CBIT Year 2 Sem 2', programme: 'BSCBITY', year: 2, faculty: 'FICT', totalStudents: 30 },
  { id: 'cls_bscbity3', code: 'BSCBITY3S2', name: 'BSc CBIT Year 3 Sem 2', programme: 'BSCBITY', year: 3, faculty: 'FICT', totalStudents: 24 },
  { id: 'cls_bscbity4', code: 'BSCBITY4S2', name: 'BSc CBIT Year 4 Sem 2', programme: 'BSCBITY', year: 4, faculty: 'FICT', totalStudents: 16 },
  // FICT BSc SE+MM
  { id: 'cls_bscsmy1', code: 'BSCSMY1S2', name: 'BSc SE+MM Year 1 Sem 2', programme: 'BSCSMY', year: 1, faculty: 'FICT', totalStudents: 38 },
  { id: 'cls_bscsmy2', code: 'BSCSMY2S2', name: 'BSc SE+MM Year 2 Sem 2', programme: 'BSCSMY', year: 2, faculty: 'FICT', totalStudents: 32 },
  { id: 'cls_bscsmy3', code: 'BSCSMY3S2', name: 'BSc SE+MM Year 3 Sem 2', programme: 'BSCSMY', year: 3, faculty: 'FICT', totalStudents: 26 },
  { id: 'cls_bscsmy4', code: 'BSCSMY4S2', name: 'BSc SE+MM Year 4 Sem 2', programme: 'BSCSMY', year: 4, faculty: 'FICT', totalStudents: 20 },
  // FICT Diploma IT
  { id: 'cls_dity1', code: 'DITY1S2', name: 'Dip IT Year 1 Sem 2', programme: 'DITY', year: 1, faculty: 'FICT', totalStudents: 45 },
  { id: 'cls_dity2', code: 'DITY2S2', name: 'Dip IT Year 2 Sem 2', programme: 'DITY', year: 2, faculty: 'FICT', totalStudents: 36 },
  // FICT Diploma CBIT
  { id: 'cls_dbity1', code: 'DBITY1S2', name: 'Dip CBIT Year 1 Sem 2', programme: 'DBITY', year: 1, faculty: 'FICT', totalStudents: 42 },
  { id: 'cls_dbity2', code: 'DBITY2S2', name: 'Dip CBIT Year 2 Sem 2', programme: 'DBITY', year: 2, faculty: 'FICT', totalStudents: 33 },
  // FICT Diploma SE+MM
  { id: 'cls_dmsey1', code: 'DMSEY1S2', name: 'Dip SE+MM Year 1 Sem 2', programme: 'DMSEY', year: 1, faculty: 'FICT', totalStudents: 40 },
  { id: 'cls_dmsey2', code: 'DMSEY2S2', name: 'Dip SE+MM Year 2 Sem 2', programme: 'DMSEY', year: 2, faculty: 'FICT', totalStudents: 31 },
  // FICT Certificate
  { id: 'cls_cbity1', code: 'CBITY1S1', name: 'Cert BIT Year 1', programme: 'CBITY', year: 1, faculty: 'FICT', totalStudents: 50 },
  // FBMG
  { id: 'cls_bahry3', code: 'BAHRY3S2', name: 'BA HRM Year 3 Sem 2', programme: 'BAHRY', year: 3, faculty: 'FBMG', totalStudents: 25 },
  { id: 'cls_bbjy3', code: 'BBJY3S2', name: 'BBA Year 3 Sem 2', programme: 'BBJY', year: 3, faculty: 'FBMG', totalStudents: 22 },
  { id: 'cls_bpcy3', code: 'BPCY3S2', name: 'BProComm Year 3 Sem 2', programme: 'BPCY', year: 3, faculty: 'FBMG', totalStudents: 20 },
  { id: 'cls_bsbty4', code: 'BSBTY4S2', name: 'BSc BizTech Year 4 Sem 2', programme: 'BSBTY', year: 4, faculty: 'FBMG', totalStudents: 18 },
  { id: 'cls_btmy2', code: 'BTMY2S2', name: 'BTourism Year 2 Sem 2', programme: 'BTMY', year: 2, faculty: 'FBMG', totalStudents: 20 },
  { id: 'cls_btmy3', code: 'BTMY3S2', name: 'BTourism Year 3 Sem 2', programme: 'BTMY', year: 3, faculty: 'FBMG', totalStudents: 15 },
  // FDI
  { id: 'cls_dbrtvy2', code: 'DBRTVY2S1', name: 'Dip BRTV Year 2 Sem 1', programme: 'DBRTVY', year: 2, faculty: 'FDI', totalStudents: 18 },
  { id: 'cls_djmy2', code: 'DJMY2S2', name: 'Dip Journalism Year 2 Sem 2', programme: 'DJMY', year: 2, faculty: 'FDI', totalStudents: 15 },
  { id: 'cls_dbmy1', code: 'DBMY1S2', name: 'Dip BizMgt Year 1 Sem 2', programme: 'DBMY', year: 1, faculty: 'FDI', totalStudents: 20 },
];

// Courses linked to each class.
export const COURSES = [
  // BSc IT Y1
  { id: 'crs_biip1210_1', code: 'BIIP1210', name: 'Imperative Programming', class: 'BSCITY1S2', lecturer: 'Tsekiso Thokoana', venue: 'MM6', time: '10:30-12:30', day: 'Thursday' },
  { id: 'crs_bidc1210_1', code: 'DIDC1210', name: 'Introduction to Data Communication', class: 'BSCITY1S2', lecturer: 'Ntsejoa Ranyali', venue: 'Room 1', time: '08:30-10:30', day: 'Monday' },
  { id: 'crs_bicl1210_1', code: 'BICL1210', name: 'Calculus I', class: 'BSCITY1S2', lecturer: 'Mpotla Nthunya', venue: 'Hall 6', time: '10:30-12:30', day: 'Tuesday' },
  { id: 'crs_bidb1210_1', code: 'BIDB1210', name: 'Introduction to Database', class: 'BSCITY1S2', lecturer: 'New Two', venue: 'MM1', time: '10:30-12:30', day: 'Tuesday' },
  { id: 'crs_bicd1210_1', code: 'BICD1210', name: 'Introduction to Computer Design', class: 'BSCITY1S2', lecturer: 'Molemo Borotho', venue: 'Workshop', time: '10:30-12:30', day: 'Wednesday' },
  // BSc IT Y2
  { id: 'crs_biop2210_1', code: 'BIOP2210', name: 'Object Oriented Programming II', class: 'BSCITY2S2', lecturer: 'Takura Bhila', venue: 'MM4', time: '08:30-10:30', day: 'Tuesday' },
  { id: 'crs_bidb2210_1', code: 'BIDB2210', name: 'Database System', class: 'BSCITY2S2', lecturer: 'Thato Makheka', venue: 'MM7', time: '08:30-10:30', day: 'Wednesday' },
  { id: 'crs_biis2210_1', code: 'BIIS2210', name: 'Information Systems', class: 'BSCITY2S2', lecturer: 'Manapo Sekopo', venue: 'Room 1', time: '10:30-12:30', day: 'Wednesday' },
  { id: 'crs_bips2210_1', code: 'BIPS2210', name: 'Probability & Statistics I', class: 'BSCITY2S2', lecturer: 'Khauta Rantai', venue: 'Hall 6', time: '10:30-12:30', day: 'Monday' },
  // BSc IT Y3
  { id: 'crs_biml3210', code: 'BIML3210', name: 'Machine Learning', class: 'BSCITY3S2', lecturer: 'Tsietsi Matjele', venue: 'MM4', time: '08:30-10:30', day: 'Monday' },
  { id: 'crs_bisa3210', code: 'BISA3210', name: 'Systems Analysis and Design', class: 'BSCITY3S2', lecturer: 'Khauhelo Mahlakeng', venue: 'Room 1', time: '08:30-10:30', day: 'Tuesday' },
  { id: 'crs_bicn3210_1', code: 'BICN3210', name: 'Computer Network', class: 'BSCITY3S2', lecturer: 'Mohale Tlali', venue: 'Net Lab', time: '10:30-12:30', day: 'Tuesday' },
  { id: 'crs_biss3210', code: 'BISS3210', name: 'System Security', class: 'BSCITY3S2', lecturer: 'Liteboho Molaoa', venue: 'MM3', time: '08:30-10:30', day: 'Wednesday' },
  { id: 'crs_biwp3210_2', code: 'BIWP3210', name: 'Web Programming', class: 'BSCITY3S2', lecturer: 'Tsepo Mofolo', venue: 'MM7', time: '10:30-12:30', day: 'Wednesday' },
  { id: 'crs_bisp3210_1', code: 'BISP3210', name: 'Software Project Management', class: 'BSCITY3S2', lecturer: 'New One', venue: 'Net Lab', time: '08:30-10:30', day: 'Friday' },
  // BSc IT Y4
  { id: 'crs_biai4212_1', code: 'BIAI4212', name: 'Artificial Intelligence', class: 'BSCITY4S2', lecturer: 'Thato Makheka', venue: 'Hall 6', time: '08:30-10:30', day: 'Monday' },
  { id: 'crs_bids4212', code: 'BIDS4212', name: 'Distributed System', class: 'BSCITY4S2', lecturer: 'Bhila', venue: 'MM5', time: '08:30-10:30', day: 'Wednesday' },
  // BSc SE+MM Y3
  { id: 'crs_bisd3210', code: 'BISD3210', name: 'Software Design', class: 'BSCSMY3S2', lecturer: 'Mohale Tlali', venue: 'MM5', time: '08:30-10:30', day: 'Monday' },
  { id: 'crs_bisp3210_2', code: 'BISP3210', name: 'Software Project Management', class: 'BSCSMY3S2', lecturer: 'Khauhelo Mahlakeng', venue: 'Room 1', time: '10:30-12:30', day: 'Monday' },
  { id: 'crs_biai3210', code: 'BIAI3210', name: 'Artificial Intelligence', class: 'BSCSMY3S2', lecturer: 'Thato Makheka', venue: 'MM5', time: '08:30-10:30', day: 'Tuesday' },
  { id: 'crs_bica3210', code: 'BICA3210', name: 'Character Animation', class: 'BSCSMY3S2', lecturer: 'Tseliso Moorosi', venue: 'MM3', time: '10:30-12:30', day: 'Tuesday' },
  { id: 'crs_bims3210', code: 'BIMS3210', name: 'Multimedia Security', class: 'BSCSMY3S2', lecturer: 'Molemo Borotho', venue: 'Workshop', time: '08:30-10:30', day: 'Thursday' },
  { id: 'crs_bimp3210', code: 'BIMP3210', name: 'Mobile Device Programming', class: 'BSCSMY3S2', lecturer: 'Tsekiso Thokoana', venue: 'MM3', time: '08:30-10:30', day: 'Friday' },
  // BSc CBIT Y1
  { id: 'crs_bibm1210', code: 'BIBM1210', name: 'Business Mathematics II', class: 'BSCBITY1S2', lecturer: 'Motobatsi Maseli', venue: 'Hall 6', time: '08:30-10:30', day: 'Monday' },
  { id: 'crs_biip1210_cbit', code: 'BIIP1210', name: 'Imperative Programming', class: 'BSCBITY1S2', lecturer: 'Kapela Morutwa', venue: 'MM1', time: '10:30-12:30', day: 'Monday' },
  { id: 'crs_bise1210_cbit', code: 'BISE1210', name: 'Principles of Software Engineering', class: 'BSCBITY1S2', lecturer: 'Manapo Sekopo', venue: 'Hall 6', time: '08:30-10:30', day: 'Wednesday' },
  { id: 'crs_bidb1210_cbit', code: 'BIDB1210', name: 'Introduction to Database', class: 'BSCBITY1S2', lecturer: 'Nthatisi Monakalali', venue: 'MM3', time: '08:30-10:30', day: 'Friday' },
  // Diploma IT Y1
  { id: 'crs_dise1210_1', code: 'DISE1210', name: 'Principles of Software Engineering', class: 'DITY1S2', lecturer: 'Uduak Imo Ebisoh', venue: 'MM7', time: '08:30-10:30', day: 'Monday' },
  { id: 'crs_didc1210_1', code: 'DIDC1210', name: 'Introduction to Data Communication', class: 'DITY1S2', lecturer: 'Mohale Tlali', venue: 'Net Lab', time: '10:30-12:30', day: 'Monday' },
  { id: 'crs_diip1210_1', code: 'DIIP1210', name: 'Imperative Programming', class: 'DITY1S2', lecturer: 'Itumeleng Mokhachane', venue: 'MM1', time: '10:30-12:30', day: 'Tuesday' },
  { id: 'crs_dicl1210_1', code: 'DICL1210', name: 'Calculus I', class: 'DITY1S2', lecturer: 'Khauta Rantai', venue: 'Room 1', time: '08:30-10:30', day: 'Wednesday' },
  { id: 'crs_didb1210_1', code: 'DIDB1210', name: 'Introduction to Database', class: 'DITY1S2', lecturer: 'Mamolapi Serutla', venue: 'MM5', time: '10:30-12:30', day: 'Wednesday' },
  { id: 'crs_dicd1210_1', code: 'DICD1210', name: 'Introduction to Computer Design', class: 'DITY1S2', lecturer: 'Molemo Borotho', venue: 'Workshop', time: '08:30-10:30', day: 'Tuesday' },
  // Cert BIT Y1
  { id: 'crs_cbid1111', code: 'CBID1111', name: 'Introduction to Databases', class: 'CBITY1S1', lecturer: 'Tseliso Moorosi', venue: 'MM4', time: '10:30-12:30', day: 'Wednesday' },
  { id: 'crs_cifp1110', code: 'CIFP1110', name: 'Fundamentals of Programming', class: 'CBITY1S1', lecturer: 'Tsekiso Thokoana', venue: 'MM2', time: '12:30-14:30', day: 'Wednesday' },
  { id: 'crs_cibw1110', code: 'CIBW1110', name: 'Basics of Web Design', class: 'CBITY1S1', lecturer: 'Ntsejoa Ranyali', venue: 'MM4', time: '08:30-10:30', day: 'Thursday' },
  { id: 'crs_cibm1110', code: 'CIBM1110', name: 'Basic Mathematics I', class: 'CBITY1S1', lecturer: 'Mamolapi Serutla', venue: 'Room 1', time: '10:30-12:30', day: 'Thursday' },
  // FBMG
  { id: 'crs_biis323', code: 'BIIS323', name: 'Information Systems for Managers', class: 'BAHRY3S2', lecturer: 'Palesa Ntho', venue: 'Net Lab', time: '14:30-16:30', day: 'Thursday' },
  { id: 'crs_biwt3210', code: 'BIWT3210', name: 'Web Technology', class: 'BBJY3S2', lecturer: 'Hlabeli Batloung', venue: 'MM5', time: '14:30-16:30', day: 'Thursday' },
  { id: 'crs_biis424', code: 'BIIS424', name: 'Internet Security', class: 'BSBTY4S2', lecturer: 'Molemo Borotho', venue: 'Workshop', time: '14:30-16:30', day: 'Thursday' },
  { id: 'crs_biwd2212', code: 'BIWD2212', name: 'Web Design for Business', class: 'BTMY2S2', lecturer: 'Ntsejoa Ranyali', venue: 'MM4', time: '10:30-12:30', day: 'Wednesday' },
  { id: 'crs_biet3212', code: 'BIET3212', name: 'E-Commerce Theories and Practices', class: 'BTMY3S2', lecturer: 'Uduak Imo Ebisoh', venue: 'Hall 6', time: '14:30-16:30', day: 'Friday' },
  // FDI
  { id: 'crs_diwt2110', code: 'DIWT2110', name: 'Web Technology', class: 'DBRTVY2S1', lecturer: 'New Two', venue: 'MM6', time: '08:30-10:30', day: 'Thursday' },
  { id: 'crs_dcwj2212', code: 'DCWJ2212', name: 'Web Journalism I', class: 'DJMY2S2', lecturer: 'New Two', venue: 'MM5', time: '14:30-16:30', day: 'Friday' },
  { id: 'crs_diis1208', code: 'DIIS1208', name: 'Business Information Systems', class: 'DBMY1S2', lecturer: 'Manapo Sekopo', venue: 'MM4', time: '10:30-12:30', day: 'Tuesday' },
];

// Demo accounts for login and testing.
export const DEMO_USERS = [
  // FMG accounts
  { id: 'u_diana', name: 'Mrs. Diana Moopisa', email: 'diana.moopisa@limkokwing.ac.ls', password: 'fmg1234', role: 'FMG', faculty: 'FICT' },
  { id: 'u_molemo_ts', name: "Mr. Molemo Ts'oeu", email: 'molemo.tsoeu@limkokwing.ac.ls', password: 'fmg1234', role: 'FMG', faculty: 'FDI' },
  // PL accounts
  { id: 'u_kapela', name: 'Mr. Kapela Morutwa', email: 'kapela.morutwa@limkokwing.ac.ls', password: 'pl1234', role: 'PL', faculty: 'FICT', plId: 'pl_kapela' },
  { id: 'u_tsietsi', name: 'Mr. Tsietsi Matjele', email: 'tsietsi.matjele@limkokwing.ac.ls', password: 'pl1234', role: 'PL', faculty: 'FICT', plId: 'pl_tsietsi' },
  // PRL accounts
  { id: 'u_reauboka', name: 'Mr. Reauboka Mphale', email: 'reauboka.mphale@limkokwing.ac.ls', password: 'prl1234', role: 'PRL', faculty: 'FDI', prlId: 'prl_reauboka' },
  { id: 'u_mpotla', name: 'Mr. Mpotla Nthunya', email: 'mpotla.nthunya@limkokwing.ac.ls', password: 'prl1234', role: 'PRL', faculty: 'FICT', prlId: 'prl_mpotla' },
  { id: 'u_khauhelo', name: 'Ms. Khauhelo Mahlakeng', email: 'khauhelo.mahlakeng@limkokwing.ac.ls', password: 'prl1234', role: 'PRL', faculty: 'FICT', prlId: 'prl_khauhelo' },
  { id: 'u_takura', name: 'Mr. Takura Bhila', email: 'takura.bhila@limkokwing.ac.ls', password: 'prl1234', role: 'PRL', faculty: 'FICT', prlId: 'prl_takura' },
  // Lecturer accounts
  { id: 'u_tsekiso', name: 'Tsekiso Thokoana', email: 'tsekiso.thokoana@limkokwing.ac.ls', password: 'lec1234', role: 'Lecturer', faculty: 'FICT', lecturerId: 'lec_tsekiso' },
  { id: 'u_molemo_b', name: 'Molemo Borotho', email: 'molemo.borotho@limkokwing.ac.ls', password: 'lec1234', role: 'Lecturer', faculty: 'FICT', lecturerId: 'lec_molemo_borotho' },
  { id: 'u_liteboho', name: 'Liteboho Molaoa', email: 'liteboho.molaoa@limkokwing.ac.ls', password: 'lec1234', role: 'Lecturer', faculty: 'FICT', lecturerId: 'lec_liteboho' },
  { id: 'u_thato', name: 'Thato Makheka', email: 'thato.makheka@limkokwing.ac.ls', password: 'lec1234', role: 'Lecturer', faculty: 'FICT', lecturerId: 'lec_thato' },
  // Student account
  { id: 'u_student1', name: 'Lebohang Mokoena', email: 'student@luct.ac.ls', password: 'student123', role: 'Student', faculty: 'FICT', class: 'BSCSMY3S2' },
];

export const WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'];

// PRL access is limited to the programmes under that PRL, as required in the brief.
// This is handled in the frontend for now.
export const PRL_STREAMS = {
  // FDI
  prl_reauboka: { faculty: 'FDI', programmes: ['DBRTVY', 'DJMY', 'DBMY'] },
  prl_thapelo_sebotsa: { faculty: 'FDI', programmes: ['DBRTVY', 'DJMY'] },
  prl_maili: { faculty: 'FDI', programmes: ['DBMY'] },

  // FICT (split programmes across PRLs)
  prl_mpotla: { faculty: 'FICT', programmes: ['BSCITY', 'DITY'] },
  prl_khauhelo: { faculty: 'FICT', programmes: ['BSCSMY', 'DMSEY'] },
  prl_takura: { faculty: 'FICT', programmes: ['BSCBITY', 'DBITY'] },
  prl_batloung: { faculty: 'FICT', programmes: ['CBITY'] },
};
