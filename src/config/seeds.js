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

  // Seed default imam profile when missing.
  const profileCheck = await query(
    'SELECT id FROM imam_profile WHERE user_id = $1',
    [adminId]
  );
  if (profileCheck.rows.length > 0) return;

  const name = 'Nojya Kassim';
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

  await query(
    `INSERT INTO imam_profile
      (user_id, name, biography, parcours, statut, arabic_name, title, education, experience, specialties, created_at, updated_at)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())`,
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
      specialties
    ]
  );
}
