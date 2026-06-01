import Link from 'next/link'
import { getAllPosts, getPostBySlug, LAYERS } from '../../../../lib/posts'
import styles from './post.module.css'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug)
  if (!post) return {}
  return {
    title: `${post.title} — Collective Loft`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://collectiveloft.com/blog/${post.slug}`,
      ...(post.cover ? { images: [{ url: post.cover }] } : {}),
    },
  }
}

export default function PostPage({ params }) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const allPosts = getAllPosts()
  const related = allPosts
    .filter(p => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3)

  const layer = LAYERS.find(l => l.number === post.layer)

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>Collective<span>Loft</span></Link>
        <div className={styles.navLinks}>
          <Link href="/blog" className={styles.navLink}>← Blog</Link>
          <Link href="/discover" className={styles.navLink}>Discover</Link>
          <Link href="/login" className={styles.navCta}>Sign in</Link>
        </div>
      </nav>

      {post.cover && (
        <div className={styles.heroCover}>
          <img src={post.cover} alt={post.title} />
        </div>
      )}

      <div className={styles.layout}>
        <article className={styles.article}>
          <header className={styles.articleHeader}>
            <div className={styles.postMeta}>
              <Link href={`/blog?layer=${post.layer}`} className={styles.postLayer}>
                Layer {post.layer} — {layer?.name}
              </Link>
              <span className={styles.postCategory}>{post.category}</span>
              <span className={styles.postDate}>{post.date}</span>
            </div>
            <h1 className={styles.postTitle}>{post.title}</h1>
            {post.excerpt && (
              <p className={styles.postExcerpt}>{post.excerpt}</p>
            )}
            <div className={styles.postByline}>By {post.author}</div>
          </header>

          <div
            className={styles.postBody}
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        </article>

        <aside className={styles.sidebar}>
          {layer && (
            <div className={styles.sidebarBlock}>
              <div className={styles.sidebarLabel}>Filed under</div>
              <div className={styles.sidebarLayerName}>Layer {layer.number}</div>
              <div className={styles.sidebarLayerFull}>{layer.name}</div>
              <div className={styles.sidebarCategories}>
                {layer.categories.map(cat => (
                  <Link
                    key={cat}
                    href={`/blog?category=${encodeURIComponent(cat)}`}
                    className={`${styles.sidebarCat} ${cat === post.category ? styles.sidebarCatActive : ''}`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className={styles.sidebarBlock}>
            <div className={styles.sidebarLabel}>Join the platform</div>
            <p className={styles.sidebarCopy}>
              Collective Loft is where serious creatives find serious collaborators. Agreements built in. Studio included.
            </p>
            <Link href="/signup" className={styles.sidebarCta}>Start your free trial →</Link>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className={styles.related}>
          <div className={styles.relatedLabel}>Related posts</div>
          <div className={styles.relatedGrid}>
            {related.map(p => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.relatedCard}>
                <div className={styles.relatedCategory}>{p.category}</div>
                <div className={styles.relatedTitle}>{p.title}</div>
                <div className={styles.relatedExcerpt}>{p.excerpt}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

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