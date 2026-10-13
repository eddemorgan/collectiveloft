/** @type {import('next').NextConfig} */
const nextConfig = {
  // The legal documents are the lawyer-approved markdown files in
  // content/legal, imported as raw strings and rendered as they are. Keeping
  // the approved file itself in the repo, byte for byte, means the site can
  // never quietly drift from what counsel signed off: a sha256 of the repo
  // copy against the approved copy settles it. asset/source is built into
  // webpack 5; no dependency is added.
  webpack(config) {
    config.module.rules.push({ test: /\.md$/, type: 'asset/source' })
    return config
  },
}

module.exports = nextConfig
