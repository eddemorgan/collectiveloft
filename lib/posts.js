// lib/posts.js
// Reads markdown files from /posts directory at build time.
// Each post is a .md file with YAML frontmatter.
//
// Frontmatter schema:
//   title:       string  (required)
//   slug:        string  (required — matches filename without .md)
//   date:        string  YYYY-MM-DD (required)
//   author:      string  (required)
//   category:    string  (required — must match CATEGORIES list)
//   layer:       number  1-4 (required — determines which layer section)
//   excerpt:     string  (required — shown on index card, 1-2 sentences)
//   cover:       string  (optional — path to image in /public/blog/)
//   featured:    boolean (optional — shows in hero slot on index)

import fs from 'fs'
import path from 'path'

const POSTS_DIR = path.join(process.cwd(), 'posts')

export const LAYERS = [
  {
    num: 1,
    title: 'The Agreement Layer',
    desc: 'Rights, terms, compensation, and how to protect your work before it begins.',
    categories: ['Collab Terms', 'Rights & Ownership', 'Creative Exchange', 'Revenue Share'],
  },
  {
    num: 2,
    title: 'The Discovery Layer',
    desc: 'Finding the right collaborator, posting briefs, and getting matched.',
    categories: ['Finding Collaborators', 'Discipline Matching', 'Collab Briefs', 'The Right Fit'],
  },
  {
    num: 3,
    title: 'The Platform Identity Layer',
    desc: 'Profiles, portfolios, the Loft Studio, and how your reputation is built.',
    categories: ['Creative Profiles', 'Community Voice', 'The Loft Studio', 'Portfolio & Work'],
  },
  {
    num: 4,
    title: 'The Authority & Ecosystem Layer',
    desc: 'Industry insight, platform news, and the bigger picture for the creative class.',
    categories: ['Industry Insight', 'Platform Updates', 'Morgan Collective Group', 'The Creative Class'],
  },
]

export const ALL_CATEGORIES = LAYERS.flatMap(l => l.categories)

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }
  const meta = {}
  match[1].split('\n').forEach(line => {
    const sep = line.indexOf(':')
    if (sep === -1) return
    const key = line.slice(0, sep).trim()
    let val = line.slice(sep + 1).trim()
    if (val === 'true') val = true
    else if (val === 'false') val = false
    else if (!isNaN(val) && val !== '') val = Number(val)
    else val = val.replace(/^['"]|['"]$/g, '')
    meta[key] = val
  })
  return { meta, body: match[2] }
}

export function getAllPosts() {
  if (!fs.existsSync(POSTS_DIR)) return []
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))
  return files
    .map(file => {
      const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8')
      const { meta, body } = parseFrontmatter(content)
      return { ...meta, body, slug: meta.slug || file.replace('.md', '') }
    })
    .filter(p => p.title && p.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getPostBySlug(slug) {
  const posts = getAllPosts()
  return posts.find(p => p.slug === slug) || null
}

export function getPostsByCategory(category) {
  return getAllPosts().filter(p => p.category === category)
}

export function getFeaturedPost() {
  const posts = getAllPosts()
  return posts.find(p => p.featured) || posts[0] || null
}