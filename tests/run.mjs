import { spawn } from 'node:child_process'
import http from 'node:http'

const PORT = 4173
const BASE = `http://localhost:${PORT}`
const isWin = process.platform === 'win32'
const npm = isWin ? 'npm.cmd' : 'npm'
const npx = isWin ? 'npx.cmd' : 'npx'

const run = (cmd, args, env = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: isWin,
      env: { ...process.env, ...env },
    })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))))
    child.on('error', reject)
  })

const waitForServer = (url, timeoutMs = 30000) =>
  new Promise((resolve, reject) => {
    const start = Date.now()
    const poll = () => {
      http
        .get(url, (res) => {
          res.resume()
          if (res.statusCode === 200) resolve()
          else if (Date.now() - start > timeoutMs) reject(new Error('server timeout'))
          else setTimeout(poll, 300)
        })
        .on('error', () => {
          if (Date.now() - start > timeoutMs) reject(new Error('server timeout'))
          else setTimeout(poll, 300)
        })
    }
    poll()
  })

const killTree = (pid) => {
  if (isWin) {
    try {
      spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' })
    } catch {
      /* ignore */
    }
  } else {
    try {
      process.kill(-pid, 'SIGKILL')
    } catch {
      try {
        process.kill(pid, 'SIGKILL')
      } catch {
        /* ignore */
      }
    }
  }
}

console.log('== Building ==')
await run(npm, ['run', 'build'])

const preview = spawn(npx, ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: isWin ? 'ignore' : 'inherit',
  shell: isWin,
  detached: isWin,
})
try {
  await waitForServer(BASE)
  console.log('\n== Smoke test ==')
  await run('node', ['tests/smoke.mjs'], { BASE_URL: BASE })
  console.log('\n== Layout verification ==')
  await run('node', ['tests/analyze.mjs'])
  console.log('\nAll test suites passed.')
} finally {
  killTree(preview.pid)
}
