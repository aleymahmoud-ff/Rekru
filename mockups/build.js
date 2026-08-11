/* Inlines app.css + shell.js into every page fragment, producing one
   self-contained .html per screen. Run: node build.js */
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, 'src')
const OUT = __dirname

const SCREENS = [
  { file: 'dashboard',          route: '/dashboard',        title: 'Dashboard' },
  { file: 'jobs',               route: '/jobs',             title: 'Jobs' },
  { file: 'job-detail',         route: '/jobs',             title: 'Senior Backend Engineer' },
  { file: 'add-candidate',      route: '/jobs',             title: 'Add Candidate' },
  { file: 'interviews',         route: '/interviews',       title: 'Interviews' },
  { file: 'stage-queue',        route: '/interviews',       title: 'Technical Interview' },
  { file: 'conduct-interview',  route: '/interviews',       title: 'Conduct Interview' },
  { file: 'analytics',          route: '/analytics',        title: 'Analytics' },
  { file: 'interview-stages',   route: '/settings/stages',  title: 'Interview Stages' },
]

const css = fs.readFileSync(path.join(SRC, 'app.css'), 'utf8')
const js = fs.readFileSync(path.join(SRC, 'shell.js'), 'utf8')

let built = 0
for (const s of SCREENS) {
  const fragPath = path.join(SRC, 'pages', s.file + '.html')
  if (!fs.existsSync(fragPath)) {
    console.log('  SKIP (no fragment):', s.file)
    continue
  }
  const frag = fs.readFileSync(fragPath, 'utf8').trim()

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${s.title} — Rekru</title>
<style>
${css}
</style>
</head>
<body data-page="${s.route}">
${frag}
<script>
${js}
</script>
</body>
</html>
`
  fs.writeFileSync(path.join(OUT, s.file + '.html'), html)
  console.log('  built', s.file + '.html', '(' + Math.round(html.length / 1024) + ' KB)')
  built++
}
console.log('\n' + built + ' of ' + SCREENS.length + ' screens built')
