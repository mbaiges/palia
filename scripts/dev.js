import { spawn } from 'node:child_process'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const children = [
  ['front', ['run', 'dev', '--prefix', 'front']],
  ['api', ['run', 'dev', '--prefix', 'api']],
].map(([name, args]) => {
  const child = spawn(npm, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  child.on('exit', (code) => {
    if (code && !shuttingDown) {
      console.error(`${name} terminó con código ${code}`)
      shutdown(code)
    }
  })
  return child
})

let shuttingDown = false
function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) child.kill('SIGINT')
  process.exitCode = code
}

process.on('SIGINT', () => shutdown())
process.on('SIGTERM', () => shutdown())
