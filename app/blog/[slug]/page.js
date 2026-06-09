import Link from 'next/link'
import { getAllPosts, getFeaturedPost, LAYERS } from '../../lib/posts'
import styles from './blog.module.css'

export const metadata = {
  title: 'The Brief — Collective Loft',
  description: 'Writing for the creative class. On collaboration, rights, craft, and the infrastructure creatives deserve.',
}

export default function BlogIndex({ searchParams }) {
  const allPosts = getAllPosts()
  const featured = getFeaturedPost()
  const activeLayer = searchParams?.layer ? Number(searchParams.layer) : null
  const activeCategory = searchParams?.category || null

  const filtered = allPosts.filter(p => {
  if (activeCategory) return p.category === activeCategory
  if (activeLayer) return p.layer === activeLayer
  return true
})

  const postsByLayer = LAYERS.map(layer => ({
    ...layer,
    posts: allPosts.filter(p => p.layer === layer.number).slice(0, 3),
  }))

  const showLayered = !activeLayer && !activeCategory

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', lineHeight: 1 }}>
            <span style={{ color: '#8B6914' }}>✦</span>
            <span style={{ color: '#1A1814' }}>Collective <em style={{ fontStyle: 'italic', color: '#8B6914' }}>Loft</em></span>
          </span>
          <span style={{ alignSelf: 'stretch', height: '0.5px', background: 'rgba(139,105,20,0.35)', margin: '5px 0' }} />
          <span style={{ fontFamily: "Arial, sans-serif", fontSize: '8.5px', letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: 1, color: 'rgba(26,24,20,0.5)' }}>Where creatives find each other</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/discover" className={styles.navLink}>Discover</Link>
          <Link href="/briefs" className={styles.navLink}>Collabs</Link>
          <Link href="/blog" className={styles.navLink}>Blog</Link>
          <Link href="/login" className={styles.navCta}>Sign in</Link>
        </div>
      </nav>

      <header className={styles.header}>
<div className={styles.headerTitle}>The Brief</div>
<h1 className={styles.headerLabel}>By Collective Loft</h1>
<p className={styles.headerSub}>For the Creative Class — on collaboration, rights, craft, and the infrastructure creatives deserve.</p>
      </header>

      <div className={styles.filterBar}>
        <Link href="/blog" className={`${styles.filterChip} ${!activeLayer && !activeCategory ? styles.filterActive : ''}`}>All</Link>
        {LAYERS.map(layer => (
          <Link
            key={layer.number}
            href={`/blog?layer=${layer.number}`}
            className={`${styles.filterChip} ${activeLayer === layer.number && !activeCategory ? styles.filterActive : ''}`}
          >
            Layer {layer.number} — {layer.name}
          </Link>
        ))}
      </div>

      <main className={styles.main}>
        {allPosts.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyMark}>✦</div>
            <p>Posts coming soon. Check back shortly.</p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <Link href="/" className={styles.footerLogo} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', lineHeight: 1 }}>
            <span style={{ color: '#8B6914' }}>✦</span>
            <span style={{ color: '#1A1814' }}>Collective <em style={{ fontStyle: 'italic', color: '#8B6914' }}>Loft</em></span>
          </span>
          <span style={{ alignSelf: 'stretch', height: '0.5px', background: 'rgba(139,105,20,0.35)', margin: '4px 0' }} />
          <span style={{ fontFamily: "Arial, sans-serif", fontSize: '7.5px', letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: 1, color: 'rgba(26,24,20,0.5)' }}>Where creatives find each other</span>
        </Link>
        <div className={styles.footerLinks}>
          <a href="#" id="blogHowItWorks" className={styles.footerLink}>How it works</a>
          <Link href="/#waitlist" className={styles.footerLink}>Early access</Link>
          <a href="https://www.instagram.com/the.collective.loft" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Instagram</a>
          <a href="mailto:help@collectiveloft.com" className={styles.footerLink}>Contact</a>
        </div>
        <div className={styles.footerCopy}>© {new Date().getFullYear()} Morgan Collective Group LLC</div>
      </footer>

      <div className="cl-demo-overlay" id="blogDemoModal">
        <div className="cl-demo-inner">
          <button className="cl-demo-close" id="blogDemoClose" aria-label="Close demo">✕</button>
          <iframe id="blogDemoFrame" src="" title="Collective Loft Platform Demo" allow="autoplay" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .cl-demo-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(10,8,6,0.82); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 2rem; opacity: 0; pointer-events: none; transition: opacity 0.4s ease;
        }
        .cl-demo-overlay.open { opacity: 1; pointer-events: auto; }
        .cl-demo-inner {
          position: relative; width: 100%; max-width: 1100px; height: 80vh;
          background: #1A1814; border-radius: 8px; overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          transform: translateY(12px) scale(0.99); transition: transform 0.4s ease;
        }
        .cl-demo-overlay.open .cl-demo-inner { transform: translateY(0) scale(1); }
        .cl-demo-inner iframe { width: 100%; height: 100%; border: 0; display: block; }
        .cl-demo-close {
          position: absolute; top: 12px; right: 12px; z-index: 2;
          width: 34px; height: 34px; border-radius: 50%; border: none; cursor: pointer;
          background: rgba(240,236,227,0.12); color: #F0ECE3; font-size: 1rem; line-height: 1;
        }
        .cl-demo-close:hover { background: rgba(240,236,227,0.22); }
        @media (max-width: 900px) { .cl-demo-inner { height: 70vh; } }
      `}} />

      <script dangerouslySetInnerHTML={{__html: `
        (function () {
          var modal = document.getElementById('blogDemoModal');
          var frame = document.getElementById('blogDemoFrame');
          var btnOpen = document.getElementById('blogHowItWorks');
          var btnClose = document.getElementById('blogDemoClose');
          if (!modal || !btnOpen) return;
          function openDemo(e) {
            if (e) e.preventDefault();
            if (!frame.src || frame.src === window.location.href) { frame.src = '/demo.html'; }
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
          }
          function closeDemo() {
            modal.classList.remove('open');
            document.body.style.overflow = '';
            setTimeout(function () { frame.src = ''; }, 400);
          }
          btnOpen.addEventListener('click', openDemo);
          btnClose.addEventListener('click', closeDemo);
          modal.addEventListener('click', function (e) { if (e.target === modal) closeDemo(); });
          document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('open')) closeDemo();
          });
        })();
      `}} />
    </div>
  )
}
