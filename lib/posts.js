import fs from 'fs'
import path from 'path'

const POSTS_DIR = path.join(process.cwd(), 'posts')

export const LAYERS = [
  {
    number: 1,
    name: 'The Agreement Layer',
    categories: ['Collab Terms', 'Rights & Ownership', 'Creative Exchange', 'Revenue Share'],
  },
  {
    number: 2,
    name: 'The Discovery Layer',
    categories: ['Finding Collaborators', 'Discipline Matching', 'Collab Briefs', 'The Right Fit'],
  },
  {
    number: 3,
    name: 'The Platform Identity Layer',
    categories: ['Creative Profiles', 'Community Voice', 'The Loft Studio', 'Portfolio & Work'],
  },
  {
    number: 4,
    name: 'The Authority & Ecosystem Layer',
    categories: ['Industry Insight', 'Platform Updates', 'Morgan Collective Group', 'The Creative Class'],
  },
]

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { data: {}, body: content }
  const raw = match[1]
  const body = content.slice(match[0].length).trim()
  const data = {}
  for (const line of raw.split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const key = line.slice(0, colon).trim()
    let val = line.slice(colon + 1).trim()
    if (val === 'true') val = true
    else if (val === 'false') val = false
    else if (!isNaN(val) && val !== '') val = Number(val)
    data[key] = val
  }
  return { data, body }
}

function markdownToHtml(md) {
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')

  const blocks = html.split(/\n\n+/)
  return blocks.map(block => {
    block = block.trim()
    if (!block) return ''
    if (/^<(h[1-3]|blockquote)/.test(block)) return block
    return `<p>${block.replace(/\n/g, ' ')}</p>`
  }).filter(Boolean).join('\n')
}

export function getAllPosts() {
  if (!fs.existsSync(POSTS_DIR)) return []
  const files = fs.readdirSync(POSTS_DIR).filter(f =>
    f.endsWith('.md') &&
    f !== 'README.md' &&
    f !== 'template-for-contributors.md'
  )
  const posts = files.map(file => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8')
    const { data } = parseFrontmatter(raw)
    if (!data.slug || !data.title) return null
    return {
      slug: data.slug,
      title: data.title,
      date: data.date || '',
      author: data.author || '',
      category: data.category || '',
      layer: data.layer ? Number(data.layer) : null,
      featured: data.featured || false,
      excerpt: data.excerpt || '',
      cover: data.cover || null,
    }
  }).filter(Boolean)
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getFeaturedPost() {
  return getAllPosts().find(p => p.featured) || null
}

export function getPostBySlug(slug) {
  const filePath = path.join(POSTS_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, body } = parseFrontmatter(raw)
  return {
    slug: data.slug || slug,
    title: data.title || '',
    date: data.date || '',
    author: data.author || '',
    category: data.category || '',
    layer: data.layer || null,
    featured: data.featured || false,
    excerpt: data.excerpt || '',
    cover: data.cover || null,
    contentHtml: markdownToHtml(body),
  }
}