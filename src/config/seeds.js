import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import env from './env.js';
import { query } from './database.js';

/**
 * Seed admin account if ADMIN_EMAIL and ADMIN_PASSWORD are provided.
 */
export async function seedAdmin() {
  // Only seed when credentials are configured.
  if (!env.adminEmail || !env.adminPassword) return;

  // Avoid duplicate admin creation.
  const existing = await query('SELECT id FROM users WHERE email = $1', [
    env.adminEmail
  ]);

  let adminId = existing.rows[0]?.id;

  if (!adminId) {
    // Store hashed password.
    const passwordHash = await bcrypt.hash(env.adminPassword, 12);
    adminId = uuidv4();
    await query(
      'INSERT INTO users (id, email, password_hash, role, created_at) VALUES ($1,$2,$3,$4,NOW())',
      [adminId, env.adminEmail, passwordHash, 'admin']
    );
  }

  // Seed super-admin account (owner) once.
  const superAdminEmail = 'moustaphabelkassimhassidd@gmail.com';
  const superAdminPassword = 'cfmlbttjn';
  const superAdminExisting = await query('SELECT id FROM users WHERE email = $1', [
    superAdminEmail
  ]);
  if (!superAdminExisting.rows[0]?.id) {
    const superAdminHash = await bcrypt.hash(superAdminPassword, 12);
    const superAdminId = uuidv4();
    await query(
      'INSERT INTO users (id, email, password_hash, role, created_at) VALUES ($1,$2,$3,$4,NOW())',
      [superAdminId, superAdminEmail, superAdminHash, 'super-admin']
    );
  }

  // Seed default imam profile when missing.
  const profileCheck = await query(
    'SELECT id FROM imam_profile WHERE user_id = $1',
    [adminId]
  );
  if (profileCheck.rows.length > 0) return;

  const name = 'Njoya Kassim';
  const biography =
    "Imam camerounais originaire de l'Ouest, âgé d'environ 41 ans, vivant au Cameroun. " +
    "Il partage une récitation claire et apaisante au service de la communauté.";
  const parcours =
    "Plus de 10 ans d'études religieuses au Tchad avec obtention d'une licence et " +
    "mémorisation du Coran. Boursier en Arabie saoudite, il a poursuivi ses études " +
    "jusqu'à l'obtention d'une licence en sciences islamiques.";
  const statut = 'Docteur';
  const arabicName = 'نجيا قاسم';
  const title = 'Imam & Enseignant';
  const education = [
    "Licence en علوم islamiques (Tchad)",
    "Doctorat en الدراسات الإسلامية (Arabie saoudite)"
  ];
  const experience = [
    "Études religieuses approfondies au Tchad (10+ ans)",
    "Poursuite académique en Arabie saoudite via bourse"
  ];
  const specialties = ['Coran', 'Jurisprudence', 'Aqida et Tawhid'];
  const i18n = {
    en: {
      name: 'Njoya Kassim',
      biography:
        'A Cameroonian imam from the West region, about 41 years old, living in Cameroon. ' +
        'He shares a calm and clear recitation for the benefit of the community.',
      parcours:
        'Over 10 years of religious studies in Chad, earning a bachelor’s degree and memorizing the Quran. ' +
        'He later received a scholarship to Saudi Arabia and completed a degree in Islamic studies.',
      statut: 'Doctor',
      title: 'Imam & Teacher',
      education: [
        'Bachelor in Islamic علوم (Chad)',
        'Doctorate in Islamic Studies (Saudi Arabia)'
      ],
      experience: [
        'Advanced religious studies in Chad (10+ years)',
        'Academic continuation in Saudi Arabia (scholarship)'
      ],
      specialties: ['Quran', 'Jurisprudence', 'Aqida and Tawhid']
    },
    ar: {
      name: 'نجيا قاسم',
      biography:
        'إمام كاميروني من منطقة الغرب، يبلغ من العمر نحو 41 سنة ويقيم في الكاميرون. ' +
        'يقدّم تلاوة هادئة واضحة لخدمة المجتمع.',
      parcours:
        'أتمّ أكثر من عشر سنوات من الدراسات الشرعية في تشاد ونال الإجازة وحفظ القرآن. ' +
        'ثم حصل على منحة إلى السعودية وأكمل دراسته حتى نال درجة في الدراسات الإسلامية.',
      statut: 'دكتور',
      title: 'إمام ومدرّس',
      education: ['إجازة في العلوم الإسلامية (تشاد)', 'دكتوراه في الدراسات الإسلامية (السعودية)'],
      experience: ['دراسات شرعية معمّقة في تشاد (10+ سنوات)', 'استمرار أكاديمي في السعودية بمنحة'],
      specialties: ['القرآن', 'الفقه', 'العقيدة والتوحيد']
    }
  };

  await query(
    `INSERT INTO imam_profile
      (user_id, name, biography, parcours, statut, arabic_name, title, education, experience, specialties, i18n, created_at, updated_at)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())`,
    [
      adminId,
      name,
      biography,
      parcours,
      statut,
      arabicName,
      title,
      education,
      experience,
      specialties,
      i18n
    ]
  );
}
