// Demo users used to create login accounts and profile records.
// Passwords are used only when creating auth accounts.

module.exports = [
  // FMG
  { name: 'Mrs. Diana Moopisa', email: 'diana.moopisa@limkokwing.ac.ls', password: 'fmg1234', role: 'FMG', faculty: 'FICT' },
  { name: "Mr. Molemo Ts'oeu", email: 'molemo.tsoeu@limkokwing.ac.ls', password: 'fmg1234', role: 'FMG', faculty: 'FDI' },

  // PL
  { name: 'Mr. Kapela Morutwa', email: 'kapela.morutwa@limkokwing.ac.ls', password: 'pl1234', role: 'PL', faculty: 'FICT', plId: 'pl_kapela' },
  { name: 'Mr. Tsietsi Matjele', email: 'tsietsi.matjele@limkokwing.ac.ls', password: 'pl1234', role: 'PL', faculty: 'FICT', plId: 'pl_tsietsi' },

  // PRL
  { name: 'Mr. Reauboka Mphale', email: 'reauboka.mphale@limkokwing.ac.ls', password: 'prl1234', role: 'PRL', faculty: 'FDI', prlId: 'prl_reauboka' },
  { name: 'Mr. Mpotla Nthunya', email: 'mpotla.nthunya@limkokwing.ac.ls', password: 'prl1234', role: 'PRL', faculty: 'FICT', prlId: 'prl_mpotla' },
  { name: 'Ms. Khauhelo Mahlakeng', email: 'khauhelo.mahlakeng@limkokwing.ac.ls', password: 'prl1234', role: 'PRL', faculty: 'FICT', prlId: 'prl_khauhelo' },
  { name: 'Mr. Takura Bhila', email: 'takura.bhila@limkokwing.ac.ls', password: 'prl1234', role: 'PRL', faculty: 'FICT', prlId: 'prl_takura' },

  // Lecturer
  { name: 'Tsekiso Thokoana', email: 'tsekiso.thokoana@limkokwing.ac.ls', password: 'lec1234', role: 'Lecturer', faculty: 'FICT', lecturerId: 'lec_tsekiso' },
  { name: 'Molemo Borotho', email: 'molemo.borotho@limkokwing.ac.ls', password: 'lec1234', role: 'Lecturer', faculty: 'FICT', lecturerId: 'lec_molemo_borotho' },
  { name: 'Liteboho Molaoa', email: 'liteboho.molaoa@limkokwing.ac.ls', password: 'lec1234', role: 'Lecturer', faculty: 'FICT', lecturerId: 'lec_liteboho' },
  { name: 'Thato Makheka', email: 'thato.makheka@limkokwing.ac.ls', password: 'lec1234', role: 'Lecturer', faculty: 'FICT', lecturerId: 'lec_thato' },

  // Student
  { name: 'Lebohang Mokoena', email: 'student@luct.ac.ls', password: 'student123', role: 'Student', faculty: 'FICT', class: 'BSCSMY3S2' },
];
