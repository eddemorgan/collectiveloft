import { getAllPosts } from '../lib/posts'

export default function sitemap() {
  const baseUrl = 'https://collectiveloft.com'

  // Static pages
  const staticPages = [
    { url: `${baseUrl}/`,     changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${baseUrl}/faq`,  changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/blog`, changeFrequency: 'weekly',  priority: 0.9 },
  ].map(p => ({ ...p, lastModified: new Date() }))

  // Blog posts (auto-included from /posts)
  const postPages = getAllPosts().map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticPages, ...postPages]
}
