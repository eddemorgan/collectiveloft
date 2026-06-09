import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug, LAYERS } from '../../../lib/posts'
import styles from './post.module.css'

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
        <Link href="/" className={styles.navLogo} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', lineHeight: 1 }}>
            <span style={{ color: '#8B6914' }}>✦</span>
            <span style={{ color: '#1A1814' }}>Collective <em style={{ fontStyle: 'italic', color: '#8B6914' }}>Loft</em></span>
          </span>
          <span style={{ alignSelf: 'stretch', height: '0.5px', background: 'rgba(139,105,20,0.35)', margin: '5px 0' }} />
          <span style={{ fontFamily: "Arial, sans-serif", fontSize: '8.5px', letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: 1, color: 'rgba(26,24,20,0.5)' }}>Where creatives find each other</span>
        </Link>
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
              {layer && (
                <Link href={`/blog?layer=${post.layer}`} className={styles.postLayer}>
                  Layer {post.layer} — {layer.name}
                </Link>
              )}
              <span className={styles.postCategory}>{post.category}</span>
              <span className={styles.postDate}>{post.date}</span>
            </div>
            <h1 className={styles.postTitle}>{post.title}</h1>
            {post.excerpt && <p className={styles.postExcerpt}>{post.excerpt}</p>}
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
            <Link href="/#waitlist" className={styles.sidebarCta}>Request early access →</Link>
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
