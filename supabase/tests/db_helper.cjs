const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
});

async function querySql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${env.SUPABASE_PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Query failed (${res.status}): ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function runAsUser(userId, role, sql) {
  // Setup JWT claim and role in a single transaction block
  const fullSql = `
    DO $$
    BEGIN
      PERFORM set_config('request.jwt.claims', '{"sub": "${userId}", "role": "${role}"}', true);
      PERFORM set_config('request.jwt.claim.sub', '${userId}', true);
      PERFORM set_config('request.jwt.claim.role', '${role}', true);
    END $$;
    ${sql}
  `;
  return await querySql(fullSql);
}

module.exports = {
  env,
  querySql,
  runAsUser,
};
