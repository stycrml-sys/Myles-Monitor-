// Builds the app for publishing as a claude.ai Artifact: relative asset
// paths, and an artifact page (no <html>/<head>/<body>; the platform wraps it)
// that loads the built bundle. Output: dist-artifact/artifact.html + assets/.
import { readFile, writeFile } from 'node:fs/promises'
import { build } from 'vite'

const outDir = 'dist-artifact'
await build({ base: './', build: { outDir, emptyOutDir: true }, logLevel: 'warn' })

const html = await readFile(`${outDir}/index.html`, 'utf8')
const tags = [
  ...html.matchAll(/<link rel="(?:stylesheet|modulepreload)"[^>]*>|<script type="module"[^>]*><\/script>/g),
].map((m) => m[0].replace(/ crossorigin/g, ''))
const styles = tags.filter((t) => t.startsWith('<link'))
const scripts = tags.filter((t) => t.startsWith('<script'))

const page = `<title>Push-ups &amp; Weigh-ins</title>
${styles.join('\n')}
<style>
  /* The artifact viewer already pads the page for the phone's status bar. */
  :root { --safe-top: 0px; --sticky-top: env(safe-area-inset-top, 0px); }
</style>
<div id="root"></div>
${scripts.join('\n')}
`
await writeFile(`${outDir}/artifact.html`, page)
console.log(`Wrote ${outDir}/artifact.html with ${styles.length} stylesheet(s), ${scripts.length} script(s)`)
