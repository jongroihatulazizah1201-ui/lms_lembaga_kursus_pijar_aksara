const { querySql } = require('./db_helper.cjs');

async function audit() {
  const sql = `
    SELECT 
      p.proname,
      pg_get_function_identity_arguments(p.oid) as args,
      p.prosecdef,
      p.proconfig,
      p.prorettype::regtype::text as return_type,
      has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_execute,
      has_function_privilege('public', p.oid, 'EXECUTE') as public_execute
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.prosecdef = true
    ORDER BY p.proname, args;
  `;
  const rows = await querySql(sql);
  console.log(`Total SECURITY DEFINER functions in public: ${rows.length}`);
  
  const violations = [];
  rows.forEach(r => {
    const isTrigger = r.return_type === 'trigger';
    const isPublicAllowed = ['get_kursus_katalog', 'verify_certificate_status'].includes(r.proname);
    
    // Harapan: anon hanya untuk get_kursus_katalog dan verify_certificate_status
    if (r.anon_execute && !isPublicAllowed) {
      violations.push({
        name: `${r.proname}(${r.args})`,
        issue: 'anon memiliki akses EXECUTE (seharusnya DITOLAK)'
      });
    }

    // Harapan: fungsi trigger tidak untuk siapa pun
    if (isTrigger && (r.anon_execute || r.auth_execute || r.public_execute)) {
      violations.push({
        name: `${r.proname}(${r.args})`,
        issue: `Trigger function memiliki execute privilege: anon=${r.anon_execute}, auth=${r.auth_execute}, public=${r.public_execute}`
      });
    }

    // Periksa search_path
    const searchPathConfig = (r.proconfig || []).find(c => c.startsWith('search_path='));
    if (!searchPathConfig) {
      violations.push({
        name: `${r.proname}(${r.args})`,
        issue: 'search_path TIDAK dikonfigurasi pada proconfig'
      });
    }
  });

  console.log('--- DAFTAR FUNGSI DAN HAK AKSES ---');
  rows.forEach(r => {
    console.log(`${r.proname}(${r.args}) | return: ${r.return_type} | config: ${r.proconfig ? r.proconfig.join(', ') : 'NONE'} | anon: ${r.anon_execute} | auth: ${r.auth_execute} | public: ${r.public_execute}`);
  });

  console.log('\n--- RINGKASAN TEMUAN / PELANGGARAN ---');
  if (violations.length === 0) {
    console.log('SEMUA SESUAI HARAPAN: Tidak ada pelanggaran hak akses atau search_path!');
  } else {
    console.log(`DITEMUKAN ${violations.length} PELANGGARAN:`);
    violations.forEach(v => console.log(`- [PELANGGARAN] ${v.name}: ${v.issue}`));
  }

  const defAclSql = `
    SELECT 
      defaclrole::regrole::text as role,
      defaclnamespace::regnamespace::text as nsp,
      defaclobjtype,
      defaclacl
    FROM pg_default_acl;
  `;
  const defAcls = await querySql(defAclSql);
  console.log('\n--- DEFAULT PRIVILEGES (pg_default_acl) ---');
  console.log(JSON.stringify(defAcls, null, 2));

  return { rows, violations, defAcls };
}

if (require.main === module) {
  audit().catch(console.error);
}

module.exports = { audit };
