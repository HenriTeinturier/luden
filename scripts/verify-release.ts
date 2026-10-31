import { spawn, execFileSync } from 'node:child_process'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'

const root = process.cwd()
const suffix = randomBytes(5).toString('hex')
const workspace = path.join(root, '.local', `release-check-${suffix}`)
const checkout = path.join(workspace, 'source')
const database = `luden_verify_${suffix}`
const project = `luden-verify-${suffix}`
// Fixed optional test ports: fail on conflicts, never stop another installation.
const dbPort = process.env.LUDEN_VERIFY_DB_PORT || '55434'
const appPort = process.env.LUDEN_VERIFY_APP_PORT || '3311'
const env = {
  ...process.env,
  COMPOSE_PROJECT_NAME: project,
  POSTGRES_DB: database,
  POSTGRES_USER: 'luden',
  POSTGRES_PASSWORD: randomBytes(24).toString('hex'),
  POSTGRES_PORT: dbPort,
  LUDEN_DATA_DIR: path.join(workspace, 'data'),
  LUDEN_CACHE_DIR: path.join(workspace, 'cache'),
  LUDEN_BACKUP_MAX_MB: '64',
  HOST: '127.0.0.1',
  PORT: appPort,
  IGDB_CLIENT_ID: '',
  IGDB_CLIENT_SECRET: '',
  LUDEN_VERIFY_ISOLATED: '1',
  DATABASE_URL: '',
}
env.DATABASE_URL = `postgresql://luden:${env.POSTGRES_PASSWORD}@127.0.0.1:${dbPort}/${database}?schema=public`
await mkdir(checkout, { recursive: true })
const files = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { cwd: root, encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean)
for (const file of new Set(files)) {
  if (file.startsWith('.git/') || file.startsWith('.local/')) continue
  const target = path.join(checkout, file)
  await mkdir(path.dirname(target), { recursive: true })
  await copyFile(path.join(root, file), target)
}
await writeFile(
  path.join(checkout, '.env'),
  Object.entries(env)
    .filter(([key]) =>
      [
        'COMPOSE_PROJECT_NAME',
        'POSTGRES_DB',
        'POSTGRES_USER',
        'POSTGRES_PASSWORD',
        'POSTGRES_PORT',
        'LUDEN_DATA_DIR',
        'LUDEN_CACHE_DIR',
        'LUDEN_BACKUP_MAX_MB',
        'HOST',
        'PORT',
        'DATABASE_URL',
        'IGDB_CLIENT_ID',
        'IGDB_CLIENT_SECRET',
      ].includes(key),
    )
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join('\n'),
)
function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd: checkout, env, stdio: 'inherit', windowsHide: true })
    child.on('error', reject)
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} : code ${code}`)),
    )
  })
}
// npm's JS entrypoint avoids shell quoting and cmd.exe on Windows.
const npm = process.env.npm_execpath
if (!npm) throw new Error('Lancez ce contrôle avec npm run verify:release.')
let server: ReturnType<typeof spawn> | undefined
let started = false
try {
  console.log(`Installation jetable : ${workspace}`)
  await run(process.execPath, [npm, 'ci'])
  await run('docker', ['compose', 'up', '-d', '--wait'])
  started = true
  await run(process.execPath, [npm, 'run', 'db:setup'])
  await run(process.execPath, [npm, 'run', 'check'])
  await run(process.execPath, [npm, 'run', 'build'])
  server = spawn(process.execPath, ['--env-file=.env', '.output/server/index.mjs'], {
    cwd: checkout,
    env,
    stdio: 'inherit',
    windowsHide: true,
  })
  server.on('error', () => undefined)
  let ready = false
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw new Error('Le serveur de vérification s’est arrêté.')
    try {
      ready = (await fetch(`http://127.0.0.1:${appPort}/settings`)).ok
    } catch {
      /* starting */
    }
    if (ready) break
    await delay(500)
  }
  if (!ready) throw new Error('Démarrage du serveur impossible.')
  await run(process.execPath, ['--import', 'tsx', 'scripts/check-backup.ts'])
  const report = {
    verifiedAt: new Date().toISOString(),
    node: process.version,
    project,
    installation: 'npm ci, db:setup, check, build, npm start',
    backup: 'round-trip DB and both media types, safety copy, interruption recovery',
    platform: process.platform,
    sourceVersion: JSON.parse(await readFile(path.join(checkout, 'package.json'), 'utf8')).version,
  }
  await writeFile(path.join(workspace, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`Vérification terminée : ${path.join(workspace, 'report.json')}`)
} finally {
  if (server && server.exitCode === null) {
    server.kill()
    await new Promise<void>((resolve) => server!.once('close', () => resolve()))
  }
  // Only the randomly named disposable project above is removed, including its test volume.
  if (started) await run('docker', ['compose', 'down', '--volumes'])
  console.log(`Fichiers de contrôle conservés hors Git : ${workspace}`)
}
