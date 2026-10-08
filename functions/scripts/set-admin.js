const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const email = String(process.argv[2] || '').trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Usage: node scripts/set-admin.js member@example.com');
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId: 'trip-plan-13743' });

async function main() {
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
  console.log(`Admin role granted to ${email}. Sign out and sign in again in the app.`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
