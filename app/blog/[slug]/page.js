import Link from 'next/link'
import { getAllPosts, getPostBySlug, LAYERS } from '../../../lib/posts'
import styles from './blog.module.css'

export const metadata = {
  title: 'Blog — Collective Loft',
  description: 'Writing for the creative class. On collaboration, rights, craft, and the infrastructure creatives deserve.',
}

export default function BlogIndex({ searchParams }) {
  const allPosts = getAllPosts()
  const featured = getFeaturedPost()
  const activeLayer = searchParams?.layer ? Number(searchParams.layer) : null
  const activeCategory = searchParams?.category || null

  const filtered = allPosts.filter(p => {
    if (p.featured) return false
    if (activeCategory) return p.category === activeCategory
    if (activeLayer) return p.layer === activeLayer
    return true
  })

  const postsByLayer = LAYERS.map(layer => ({
    ...layer,
    posts: allPosts.filter(p => !p.featured && p.layer === layer.number).slice(0, 3),
  }))

  const showLayered = !activeLayer && !activeCategory

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>Collective<span>Loft</span></Link>
        <div className={styles.navLinks}>
          <Link href="/discover" className={styles.navLink}>Discover</Link>
          <Link href="/briefs" className={styles.navLink}>Collabs</Link>
          <Link href="/blog" className={styles.navLink}>Blog</Link>
          <Link href="/login" className={styles.navCta}>Sign in</Link>
        </div>
      </nav>

      <header className={styles.header}>
        <div className={styles.headerLabel}>The Collective Loft Blog</div>
        <h1 className={styles.headerTitle}>For the Creative Class</h1>
        <p className={styles.headerSub}>On collaboration, rights, craft, and the infrastructure creatives deserve.</p>
      </header>

      <div className={styles.filterBar}>
        <Link href="/blog" className={`${styles.filterChip} ${!activeLayer && !activeCategory ? styles.filterActive : ''}`}>All</Link>
        {LAYERS.map(layer => (
          <Link
            key={layer.number}
            href={`/blog?layer=${layer.number}`}
            className={`${styles.filterChip} ${activeLayer === layer.number && !activeCategory ? styles.filterActive : ''}`}
          >
            Layer {layer.number}
          </Link>
        ))}
      </div>

      <main className={styles.main}>
        {featured && !activeLayer && !activeCategory && (
          <section className={styles.featuredSection}>
            <div className={styles.featuredLabel}>Featured</div>
            <Link href={`/blog/${featured.slug}`} className={styles.featured}>
              {featured.cover && (
                <div className={styles.featuredCover}>
                  <img src={featured.cover} alt={featured.title} />
                </div>
              )}
              <div className={styles.featuredContent}>
                <div className={styles.postMeta}>
                  <span className={styles.postCategory}>{featured.category}</span>
                  <span className={styles.postDate}>{featured.date}</span>
                </div>
                <h2 className={styles.featuredTitle}>{featured.title}</h2>
                <p className={styles.featuredExcerpt}>{featured.excerpt}</p>
                <div className={styles.featuredAuthor}>By {featured.author}</div>
                <div className={styles.readMore}>Read post →</div>
              </div>
            </Link>
          </section>
        )}

        {showLayered ? (
          postsByLayer.map(layer => layer.posts.length > 0 && (
            <section key={layer.number} className={styles.layerSection}>
              <div className={styles.layerHeader}>
                <div className={styles.layerLabel}>Layer {layer.number}</div>
                <h2 className={styles.layerName}>{layer.name}</h2>
                <Link href={`/blog?layer=${layer.number}`} className={styles.layerSeeAll}>See all →</Link>
              </div>
              <div className={styles.postGrid}>
                {layer.posts.map(post => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.postCard}>
                    {post.cover && (
                      <div className={styles.postCover}>
                        <img src={post.cover} alt={post.title} />
                      </div>
                    )}
                    <div className={styles.postCardContent}>
                      <div className={styles.postMeta}>
                        <span className={styles.postCategory}>{post.category}</span>
                        <span className={styles.postDate}>{post.date}</span>
                      </div>
                      <h3 className={styles.postTitle}>{post.title}</h3>
                      <p className={styles.postExcerpt}>{post.excerpt}</p>
                      <div className={styles.postAuthor}>By {post.author}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        ) : (
          <section className={styles.filteredSection}>
            {activeCategory && <h2 className={styles.filteredTitle}>{activeCategory}</h2>}
            {activeLayer && !activeCategory && (
              <h2 className={styles.filteredTitle}>
                Layer {activeLayer} — {LAYERS.find(l => l.number === activeLayer)?.name}
              </h2>
            )}
            {filtered.length === 0 ? (
              <p className={styles.empty}>No posts yet in this category. Check back soon.</p>
            ) : (
              <div className={styles.postGrid}>
                {filtered.map(post => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.postCard}>
                    {post.cover && (
                      <div className={styles.postCover}>
                        <img src={post.cover} alt={post.title} />
                      </div>
                    )}
                    <div className={styles.postCardContent}>
                      <div className={styles.postMeta}>
                        <span className={styles.postCategory}>{post.category}</span>
                        <span className={styles.postDate}>{post.date}</span>
                      </div>
                      <h3 className={styles.postTitle}>{post.title}</h3>
                      <p className={styles.postExcerpt}>{post.excerpt}</p>
                      <div className={styles.postAuthor}>By {post.author}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <Link href="/" className={styles.footerLogo}>Collective<span>Loft</span></Link>
        <div className={styles.footerLinks}>
          <Link href="/discover" className={styles.footerLink}>Discover</Link>
          <Link href="/briefs" className={styles.footerLink}>Collabs</Link>
          <Link href="/blog" className={styles.footerLink}>Blog</Link>
        </div>
        <div className={styles.footerCopy}>© {new Date().getFullYear()} Morgan Collective Group LLC</div>
      </footer>
    </div>
  )
}