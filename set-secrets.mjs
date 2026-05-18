import _sodium from './node_modules/libsodium-wrappers/dist/modules/libsodium-wrappers.js';

const TOKEN = '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';
const REPO  = 'gmjm2023-byte/sabino-rifas';

const SECRETS = {
  FTP_HOST: '82.25.73.150',
  FTP_USER: 'u765729833',
  FTP_PASS: '*Bc220599*',
  FTP_PATH: '/public_html/',
};

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
  'User-Agent': 'sabino-deploy-setup',
};

await _sodium.ready;
const sodium = _sodium;

// 1. Buscar chave pública do repositório
const keyRes = await fetch(
  `https://api.github.com/repos/${REPO}/actions/secrets/public-key`,
  { headers }
);
const keyData = await keyRes.json();
console.log('Resposta chave pública:', keyData);
const { key, key_id } = keyData;

// 2. Encriptar com libsodium sealed box (método oficial do GitHub)
function encryptSecret(base64Key, secretValue) {
  const binKey     = sodium.from_base64(base64Key, sodium.base64_variants.ORIGINAL);
  const binSecret  = sodium.from_string(secretValue);
  const encrypted  = sodium.crypto_box_seal(binSecret, binKey);
  return sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL);
}

// 3. Publicar cada secret na API
let ok = 0;
for (const [name, value] of Object.entries(SECRETS)) {
  const encrypted_value = encryptSecret(key, value);
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/secrets/${name}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ encrypted_value, key_id }),
    }
  );
  if (res.status === 201 || res.status === 204) {
    console.log(`✅ ${name}`);
    ok++;
  } else {
    const body = await res.text();
    console.log(`❌ ${name} (${res.status}):`, body);
  }
}

console.log(`\n${ok}/${Object.keys(SECRETS).length} secrets configurados no GitHub`);
