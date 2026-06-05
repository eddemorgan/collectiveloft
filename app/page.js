import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Collective Loft — The Professional Network for the Creative Class</title>
        <meta name="description" content="The platform where artists, musicians, writers, designers, and filmmakers find each other, agree on terms, and make something real." />
        <meta property="og:title" content="Collective Loft" />
        <meta property="og:description" content="Building the infrastructure meant for the creative class." />
        <meta property="og:url" content="https://collectiveloft.com" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg0: #F0ECE3;
          --bg1: #E8E3D9;
          --bg2: #DDD8CE;
          --cream: #1A1814;
          --gold: #8B6914;
          --gold2: #A07C1A;
          --teal: #2A7A68;
          --muted: rgba(26,24,20,0.55);
          --faint: rgba(26,24,20,0.1);
          --serif: 'Cormorant Garamond', Georgia, serif;
          --sans: 'DM Sans', system-ui, sans-serif;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--bg1);
          color: var(--cream);
          font-family: var(--sans);
          font-weight: 300;
          line-height: 1.6;
          overflow-x: hidden;
        }

        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 999;
          opacity: 0.25;
        }

        /* DEMO MODAL */
        .demo-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10,8,6,0.92);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s ease;
          backdrop-filter: blur(8px);
        }
        .demo-modal-overlay.open {
          opacity: 1;
          pointer-events: all;
        }
        .demo-modal-inner {
          width: 100%;
          max-width: 1100px;
          height: 85vh;
          position: relative;
          border: 0.5px solid rgba(139,105,20,0.3);
          border-radius: 6px;
          overflow: hidden;
          transform: translateY(20px) scale(0.98);
          transition: transform 0.4s ease;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6);
        }
        .demo-modal-overlay.open .demo-modal-inner {
          transform: translateY(0) scale(1);
        }
        .demo-modal-inner iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }
        .demo-modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(26,23,20,0.85);
          border: 0.5px solid rgba(139,105,20,0.3);
          color: rgba(240,236,227,0.6);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.85rem;
          z-index: 10;
          transition: all 0.15s;
          font-family: var(--sans);
          line-height: 1;
        }
        .demo-modal-close:hover {
          background: rgba(139,105,20,0.3);
          color: #F0ECE3;
          border-color: rgba(139,105,20,0.5);
        }

        /* NAV */
        nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 3rem;
          border-bottom: 0.5px solid var(--faint);
          background: rgba(240,236,227,0.92);
          backdrop-filter: blur(12px);
        }

        .logo {
          font-family: var(--serif);
          font-size: 1.55rem;
          font-weight: 400;
          letter-spacing: 0.02em;
          color: var(--cream);
          text-decoration: none;
        }
        .logo span { color: var(--gold); }

        .nav-cta {
          font-family: var(--sans);
          font-size: 0.82rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--bg0);
          background: var(--gold);
          border: none;
          padding: 0.55rem 1.25rem;
          border-radius: 2px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s;
        }
        .nav-cta:hover { background: var(--gold2); }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 8rem 2rem 6rem;
          position: relative;
          overflow: hidden;
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(139,105,20,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,105,20,0.06) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 100%);
        }

        .hero-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,105,20,0.06) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .eyebrow {
          font-family: var(--sans);
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          opacity: 0.8;
          margin-bottom: 1.5rem;
          animation: fadeUp 0.8s ease both;
        }

        .hero h1 {
          font-family: var(--serif);
          font-size: clamp(3rem, 8vw, 6.5rem);
          font-weight: 300;
          line-height: 1.05;
          color: var(--cream);
          margin-bottom: 1rem;
          animation: fadeUp 0.8s 0.1s ease both;
        }

        .hero h1 em { font-style: italic; color: var(--gold); }

        .hero-sub {
          font-family: var(--sans);
          font-size: clamp(1rem, 2vw, 1.2rem);
          font-weight: 300;
          color: rgba(26,24,20,0.55);
          max-width: 560px;
          margin: 0 auto 2.5rem;
          line-height: 1.75;
          animation: fadeUp 0.8s 0.2s ease both;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          animation: fadeUp 0.8s 0.3s ease both;
        }

        .btn-primary {
          font-family: var(--sans);
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--bg0);
          background: var(--gold);
          border: none;
          padding: 0.8rem 2rem;
          border-radius: 2px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .btn-primary:hover { background: var(--gold2); transform: translateY(-1px); }

        .btn-ghost {
          font-family: var(--sans);
          font-size: 0.85rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          background: none;
          border: 0.5px solid rgba(26,24,20,0.2);
          padding: 0.8rem 2rem;
          border-radius: 2px;
          cursor: pointer;
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-ghost:hover { border-color: rgba(26,24,20,0.4); color: var(--cream); }

        .discipline-scroll {
          margin-top: 4rem;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
          animation: fadeUp 0.8s 0.4s ease both;
        }

        .disc-tag {
          font-family: var(--sans);
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(26,24,20,0.4);
          border: 0.5px solid rgba(26,24,20,0.15);
          padding: 0.3rem 0.75rem;
          border-radius: 2px;
        }

        /* STATS */
        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border-top: 0.5px solid var(--faint);
          border-bottom: 0.5px solid var(--faint);
        }

        .stat {
          padding: 3.5rem 2rem;
          text-align: center;
          border-right: 0.5px solid var(--faint);
        }
        .stat:last-child { border-right: none; }

        .stat-num {
          font-family: var(--serif);
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 300;
          color: var(--gold);
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-family: var(--sans);
          font-size: 0.8rem;
          font-weight: 400;
          letter-spacing: 0.06em;
          color: var(--muted);
          line-height: 1.5;
        }

        section { padding: 7rem 2rem; }
        .container { max-width: 1100px; margin: 0 auto; }

        .section-eyebrow {
          font-family: var(--sans);
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gold);
          opacity: 0.75;
          margin-bottom: 1.25rem;
        }

        .section-title {
          font-family: var(--serif);
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 300;
          line-height: 1.15;
          color: var(--cream);
          margin-bottom: 1.5rem;
        }
        .section-title em { font-style: italic; color: var(--gold); }

        .section-body {
          font-family: var(--sans);
          font-size: 1.1rem;
          font-weight: 300;
          color: var(--muted);
          max-width: 600px;
          line-height: 1.8;
        }

        /* PROBLEM */
        .problem-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: var(--faint);
          border: 0.5px solid var(--faint);
          margin-top: 4rem;
        }

        .problem-card {
          background: var(--bg2);
          padding: 2.5rem;
          position: relative;
        }

        .problem-platform {
          font-family: var(--sans);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(26,24,20,0.4);
          margin-bottom: 0.75rem;
        }

        .problem-title {
          font-family: var(--serif);
          font-size: 1.5rem;
          font-weight: 400;
          color: var(--cream);
          margin-bottom: 0.5rem;
        }

        .problem-text {
          font-family: var(--sans);
          font-size: 0.88rem;
          font-weight: 300;
          color: var(--muted);
          line-height: 1.7;
        }

        .problem-x {
          position: absolute;
          top: 2rem;
          right: 2rem;
          font-size: 1rem;
          color: rgba(160,60,70,0.5);
        }

        /* FLOW */
        .flow-section {
          background: var(--bg2);
          border-top: 0.5px solid var(--faint);
          border-bottom: 0.5px solid var(--faint);
        }

        .flow-intro {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6rem;
          align-items: center;
          margin-bottom: 5rem;
        }

        .flow-steps { display: flex; flex-direction: column; gap: 0; }

        .flow-step {
          display: grid;
          grid-template-columns: 3rem 1fr;
          gap: 1.5rem;
          padding: 2rem 0;
          border-bottom: 0.5px solid var(--faint);
          align-items: start;
        }
        .flow-step:last-child { border-bottom: none; }

        .flow-num {
          font-family: var(--serif);
          font-size: 2rem;
          font-weight: 300;
          color: var(--gold);
          opacity: 0.4;
          line-height: 1;
          padding-top: 0.15rem;
        }

        .flow-title {
          font-family: var(--sans);
          font-size: 0.92rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: var(--cream);
          margin-bottom: 0.35rem;
        }

        .flow-desc {
          font-family: var(--sans);
          font-size: 0.85rem;
          font-weight: 300;
          color: var(--muted);
          line-height: 1.7;
        }

        /* MOCKUP */
        .mockup-wrap {
          border: 0.5px solid rgba(139,105,20,0.2);
          border-radius: 6px;
          overflow: hidden;
          background: var(--bg1);
        }

        .mockup-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-bottom: 0.5px solid var(--faint);
          background: var(--bg2);
        }

        .mockup-dot { width: 10px; height: 10px; border-radius: 50%; }
        .mockup-screen { padding: 1.5rem; }

        .mock-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 0.5px solid var(--faint);
        }

        .mock-logo { font-family: var(--serif); font-size: 1rem; color: var(--cream); }
        .mock-logo span { color: var(--gold); }
        .mock-links { display: flex; gap: 1rem; }
        .mock-link { font-family: var(--sans); font-size: 0.7rem; color: rgba(26,24,20,0.4); letter-spacing: 0.06em; }

        .mock-brief {
          background: rgba(26,24,20,0.04);
          border: 0.5px solid rgba(26,24,20,0.1);
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 0.65rem;
        }

        .mock-tags { display: flex; gap: 0.35rem; margin-bottom: 0.5rem; }

        .mock-tag {
          font-family: var(--sans);
          font-size: 0.6rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 1px 6px;
          border-radius: 2px;
        }

        .mock-tag-gold { background: rgba(139,105,20,0.12); color: var(--gold); }
        .mock-tag-teal { background: rgba(42,122,104,0.12); color: var(--teal); }

        .mock-brief-title {
          font-family: var(--sans);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--cream);
          margin-bottom: 0.25rem;
        }

        .mock-brief-sub {
          font-family: var(--sans);
          font-size: 0.72rem;
          color: rgba(26,24,20,0.5);
          line-height: 1.5;
        }

        .mock-studio {
          background: rgba(139,105,20,0.06);
          border: 0.5px solid rgba(139,105,20,0.2);
          border-radius: 4px;
          padding: 1rem;
          margin-top: 0.75rem;
        }

        .mock-studio-label {
          font-family: var(--sans);
          font-size: 0.6rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 0.35rem;
          opacity: 0.7;
        }

        .mock-studio-title {
          font-family: var(--sans);
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--cream);
          margin-bottom: 0.2rem;
        }

        .mock-progress {
          height: 2px;
          background: rgba(26,24,20,0.1);
          border-radius: 1px;
          margin-top: 0.5rem;
          overflow: hidden;
        }

        .mock-progress-fill {
          height: 100%;
          width: 35%;
          background: var(--gold);
          border-radius: 1px;
        }

        /* FLYWHEEL */
        .flywheel-section { background: var(--bg1); }

        .flywheel-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: var(--faint);
          border: 0.5px solid var(--faint);
          margin-top: 4rem;
        }

        .flywheel-card {
          background: var(--bg1);
          padding: 3rem;
          position: relative;
          overflow: hidden;
        }

        .flywheel-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
        }

        .fw-01::before { background: linear-gradient(90deg, var(--gold), transparent); }
        .fw-02::before { background: linear-gradient(90deg, var(--teal), transparent); }
        .fw-03::before { background: linear-gradient(90deg, #7a50a0, transparent); }
        .fw-04::before { background: linear-gradient(90deg, #3a6a9a, transparent); }

        .fw-num {
          font-family: var(--serif);
          font-size: 4rem;
          font-weight: 300;
          line-height: 1;
          margin-bottom: 1.5rem;
          opacity: 0.08;
          color: var(--cream);
        }

        .fw-status {
          display: inline-block;
          font-family: var(--sans);
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 2px;
          margin-bottom: 1rem;
        }

        .fw-status-live { background: rgba(42,122,104,0.15); color: var(--teal); }
        .fw-status-planned { background: rgba(26,24,20,0.08); color: rgba(26,24,20,0.45); border: 0.5px solid rgba(26,24,20,0.15); }

        .fw-title {
          font-family: var(--serif);
          font-size: 1.75rem;
          font-weight: 400;
          color: var(--cream);
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }

        .fw-sub {
          font-family: var(--sans);
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 1rem;
        }

        .fw-desc {
          font-family: var(--sans);
          font-size: 0.88rem;
          font-weight: 300;
          color: var(--muted);
          line-height: 1.75;
        }

        /* QUOTE */
        .quote-section {
          background: var(--bg2);
          border-top: 0.5px solid var(--faint);
          border-bottom: 0.5px solid var(--faint);
          text-align: center;
          padding: 6rem 2rem;
        }

        blockquote {
          font-family: var(--serif);
          font-size: clamp(1.4rem, 3vw, 2.2rem);
          font-weight: 300;
          font-style: italic;
          color: var(--cream);
          max-width: 800px;
          margin: 0 auto 1.5rem;
          line-height: 1.4;
        }

        blockquote em { color: var(--gold); font-style: normal; }

        .quote-attr {
          font-family: var(--sans);
          font-size: 0.75rem;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(26,24,20,0.4);
        }

        /* FAQ */
        .faq-section {
          background: var(--bg1);
          border-top: 0.5px solid var(--faint);
          border-bottom: 0.5px solid var(--faint);
          padding: 7rem 2rem;
        }

        .faq-inner {
          max-width: 760px;
          margin: 0 auto;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-top: 3rem;
        }

        .faq-item {
          padding: 2.25rem 0;
          border-bottom: 0.5px solid var(--faint);
        }
        .faq-item:last-child { border-bottom: none; }

        .faq-q {
          font-family: var(--serif);
          font-size: 1.4rem;
          font-weight: 400;
          color: var(--cream);
          margin-bottom: 0.75rem;
          line-height: 1.25;
        }

        .faq-a {
          font-family: var(--sans);
          font-size: 1rem;
          font-weight: 300;
          color: var(--muted);
          line-height: 1.8;
          max-width: 620px;
        }

        /* WAITLIST */
        .waitlist-section {
          background: var(--bg1);
          text-align: center;
          padding: 8rem 2rem;
        }

        .waitlist-inner { max-width: 560px; margin: 0 auto; }

        .waitlist-mark {
          font-size: 1.5rem;
          color: var(--gold);
          margin-bottom: 1.5rem;
          display: block;
        }

        .waitlist-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: stretch;
          margin-top: 2.5rem;
        }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

        .form-input {
          background: var(--bg2);
          border: 0.5px solid rgba(26,24,20,0.15);
          border-radius: 3px;
          padding: 0.85rem 1rem;
          font-family: var(--sans);
          font-size: 0.92rem;
          font-weight: 300;
          color: var(--cream);
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }
        .form-input::placeholder { color: rgba(26,24,20,0.3); }
        .form-input:focus { border-color: rgba(139,105,20,0.4); }

        .form-select {
          background: var(--bg2);
          border: 0.5px solid rgba(26,24,20,0.15);
          border-radius: 3px;
          padding: 0.85rem 1rem;
          font-family: var(--sans);
          font-size: 0.92rem;
          font-weight: 300;
          color: var(--cream);
          outline: none;
          width: 100%;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
        }
        .form-select:focus { border-color: rgba(139,105,20,0.4); }

        .form-submit {
          background: var(--gold);
          color: var(--bg0);
          border: none;
          border-radius: 3px;
          padding: 0.9rem 2rem;
          font-family: var(--sans);
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .form-submit:hover { background: var(--gold2); transform: translateY(-1px); }

        .waitlist-fine {
          font-family: var(--sans);
          font-size: 0.75rem;
          color: rgba(26,24,20,0.3);
          margin-top: 1rem;
          letter-spacing: 0.04em;
        }

        .success-msg {
          display: none;
          background: rgba(42,122,104,0.08);
          border: 0.5px solid rgba(42,122,104,0.25);
          border-radius: 4px;
          padding: 1.5rem;
          font-family: var(--sans);
          font-size: 0.92rem;
          color: var(--teal);
          line-height: 1.6;
          margin-top: 1rem;
        }

        /* FOOTER */
        footer {
          border-top: 0.5px solid var(--faint);
          padding: 2.5rem 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .footer-logo { font-family: var(--serif); font-size: 1.2rem; color: var(--cream); text-decoration: none; }
        .footer-logo span { color: var(--gold); }
        .footer-links { display: flex; gap: 2rem; align-items: center; }

        .footer-link {
          font-family: var(--sans);
          font-size: 0.75rem;
          font-weight: 400;
          letter-spacing: 0.08em;
          color: rgba(26,24,20,0.4);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-link:hover { color: rgba(26,24,20,0.7); }

        .footer-copy {
          font-family: var(--sans);
          font-size: 0.72rem;
          color: rgba(26,24,20,0.25);
          letter-spacing: 0.04em;
        }

        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .reveal.visible { opacity: 1; transform: translateY(0); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          nav { padding: 1rem 1.5rem; }
          .stats { grid-template-columns: 1fr; }
          .stat { border-right: none; border-bottom: 0.5px solid var(--faint); }
          .problem-grid { grid-template-columns: 1fr; }
          .flow-intro { grid-template-columns: 1fr; gap: 3rem; }
          .flywheel-grid { grid-template-columns: 1fr; }
          footer { flex-direction: column; gap: 1.5rem; text-align: center; }
          .footer-links { flex-wrap: wrap; justify-content: center; }
          .form-row { grid-template-columns: 1fr; }
          .demo-modal-inner { height: 70vh; }
        }
      `}</style>

      {/* DEMO MODAL */}
      <div className="demo-modal-overlay" id="demoModal">
        <div className="demo-modal-inner">
          <button className="demo-modal-close" id="demoClose" aria-label="Close demo">✕</button>
          <iframe id="demoFrame" src="" title="Collective Loft Platform Demo" allow="autoplay" />
        </div>
      </div>

      <nav>
        <a href="/" className="logo">Collective <span>Loft</span></a>
        <a href="#waitlist" className="nav-cta">Request early access</a>
      </nav>

      <section className="hero">
        <div className="hero-grid"></div>
        <div className="hero-glow"></div>
        <div className="eyebrow">Collective Loft · Est. 2026 · </div>
<h1>
  Building the infrastructure<br/>
  <em>meant</em> for the<br/>
  <em>creative class.</em>
</h1>
        <p className="hero-sub">
          The professional network where artists, musicians, writers, designers, and filmmakers find each other, negotiate real terms, and open a Loft Studio — a shared workspace built around the work.
        </p>
        <div className="hero-actions">
          <a href="#waitlist" className="btn-primary">Request early access ↗</a>
          <button className="btn-ghost" id="btnSeeHowItWorks">See how it works</button>
          <a href="/blog" className="btn-ghost">Read The Brief</a>
        </div>
        <div className="discipline-scroll">
          {['Visual Art','Music','Writing','Design & Web','Film','Photography','Performance','Creative Tech'].map(d => (
            <span key={d} className="disc-tag">{d}</span>
          ))}
        </div>
      </section>

      <div className="stats reveal">
        <div className="stat">
          <div className="stat-num">165M+</div>
          <div className="stat-label">Independent creative professionals<br/>worldwide</div>
        </div>
        <div className="stat">
          <div className="stat-num">0</div>
          <div className="stat-label">Platforms built around how creative<br/>collaboration actually works</div>
        </div>
        <div className="stat">
          <div className="stat-num">8</div>
          <div className="stat-label">Disciplines. One network.<br/>One place to make something real.</div>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="reveal">
            <div className="section-eyebrow">The problem</div>
            <h2 className="section-title">Every platform built &ldquo;for&rdquo; creatives<br/><em>treats them as something else.</em></h2>
            <p className="section-body">Service workers. Content producers. Portfolio holders. Generic professionals. None of them are built for what actually drives creative output: the relationship between complementary disciplines that produces work neither party could make alone.</p>
          </div>
          <div className="problem-grid reveal">
            {[
              ['LinkedIn','Built for corporate professionals.','Treats a musician\'s profile like a résumé. Optimizes for job applications, not creative relationships.'],
              ['Upwork','Client-worker hierarchy.','Race to the bottom on price. Not a creative relationship. Not a collaboration. A transaction that extracts value from the creative.'],
              ['Behance','Work sits waiting to be found.','Passive. Beautiful. No path from profile to project. No terms. No workspace. No way to actually work together.'],
              ['Instagram','Optimizes for attention.','Engagement is the metric. Not completed work. Not creative relationships. Not shared projects that outlast the algorithm.'],
            ].map(([platform, title, text]) => (
              <div key={platform} className="problem-card">
                <div className="problem-x">✕</div>
                <div className="problem-platform">{platform}</div>
                <div className="problem-title">{title}</div>
                <div className="problem-text">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flow-section" id="how-it-works">
        <div className="container">
          <div className="flow-intro">
            <div className="reveal">
              <div className="section-eyebrow">How it works</div>
              <h2 className="section-title">From first discovery<br/>to <em>Loft Studio.</em></h2>
              <p className="section-body">Every step from finding the right collaborator to opening a shared workspace is built into the platform. No cold DMs into the void. No contract templates from Google. No shared Notion page held together with hope.</p>
            </div>
            <div className="mockup-wrap reveal">
              <div className="mockup-bar">
                <div className="mockup-dot" style={{background:'#ff5f57'}}></div>
                <div className="mockup-dot" style={{background:'#febc2e'}}></div>
                <div className="mockup-dot" style={{background:'#28c840'}}></div>
              </div>
              <div className="mockup-screen">
                <div className="mock-nav">
                  <div className="mock-logo">Collective <span>Loft</span></div>
                  <div className="mock-links">
                    <span className="mock-link">Discover</span>
                    <span className="mock-link">Collabs</span>
                    <span className="mock-link" style={{color:'var(--gold)'}}>My Studios</span>
                  </div>
                </div>
                <div className="mock-brief">
                  <div className="mock-tags">
                    <span className="mock-tag mock-tag-gold">Music</span>
                    <span className="mock-tag mock-tag-teal">Paid</span>
                  </div>
                  <div className="mock-brief-title">Looking for a film composer for a short documentary</div>
                  <div className="mock-brief-sub">18-minute doc on Chicago muralists. Need an original score that sits between ambient and jazz.</div>
                </div>
                <div className="mock-brief" style={{opacity:0.5}}>
                  <div className="mock-tags">
                    <span className="mock-tag mock-tag-gold">Visual Art</span>
                  </div>
                  <div className="mock-brief-title">Painter seeking musician for gallery installation</div>
                  <div className="mock-brief-sub">Looking for someone to score a 4-panel immersive oil work. Creative exchange.</div>
                </div>
                <div className="mock-studio">
                  <div className="mock-studio-label">✦ Loft Studio · Active</div>
                  <div className="mock-studio-title">Documentary Score · Chicago Muralists</div>
                  <div style={{fontFamily:'var(--sans)',fontSize:'0.68rem',color:'rgba(26,24,20,0.5)',marginTop:'0.15rem'}}>With Jordan Kim · 1 of 3 milestones complete</div>
                  <div className="mock-progress"><div className="mock-progress-fill"></div></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flow-steps reveal">
            {[
              ['01','Post a Collab Brief','Write what you\'re making and who you need — in creative language, not a job listing. Filtered by discipline, compensation type, and location. Creatives find each other here.'],
              ['02','Review applications','Applicants send a message explaining why they\'re drawn to the project. You review, read their profile and portfolio, and accept who you want to move forward with.'],
              ['03','Agree on Collab Terms','Creative exchange, paid, or revenue share. Rights, deliverables, milestones, timeline. Both parties review, modify, and accept before any work begins. Terms are timestamped.'],
              ['04','The Loft Studio opens','The golden ticket. A shared workspace with the original brief pinned at the top, milestones, files, and persistent messaging. The collaboration has a home now.'],
            ].map(([num, title, desc]) => (
              <div key={num} className="flow-step">
                <div className="flow-num">{num}</div>
                <div>
                  <div className="flow-title">{title}</div>
                  <div className="flow-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="quote-section reveal">
        <blockquote>
          &ldquo;The creative class has never had a professional network, a structured agreement layer, or a shared workspace built around how they actually work. <em>Collective Loft builds all three.</em>&rdquo;
        </blockquote>
        <div className="quote-attr">Edde Morgan · CEO &amp; Founder, Morgan Collective Group</div>
      </div>

      <section className="flywheel-section">
        <div className="container">
          <div className="reveal">
            <div className="section-eyebrow">The ecosystem</div>
            <h2 className="section-title">Four divisions.<br/><em>One flywheel.</em></h2>
            <p className="section-body">Collective Loft is the flagship of Morgan Collective Group. The platform finds the talent. The studio gives them a home. The label releases their work. Publishing protects everything they create. Each division makes every other division stronger.</p>
          </div>
          <div className="flywheel-grid reveal">
            <div className="flywheel-card fw-01">
              <div className="fw-num">01</div>
              <div className="fw-status fw-status-live">Live now · Year 1</div>
              <div className="fw-title">Collective Loft Platform</div>
              <div className="fw-sub">Digital Network · amp; Remote</div>
              <div className="fw-desc">The professional network for the creative class. Profiles, Collab Briefs, discipline matching, Collab Terms, and the Loft Studio. Where creatives find each other and manage real projects together. The foundation everything else grows from.</div>
            </div>
            <div className="flywheel-card fw-02">
              <div className="fw-num">02</div>
              <div className="fw-status fw-status-planned">Planned · Year 2</div>
              <div className="fw-title">Collective Loft Studios</div>
              <div className="fw-sub">Recording & Art Studios · </div>
              <div className="fw-desc">Professional recording infrastructure built for independent artists. Multiple rooms, professional equipment, accessible rates. Priority booking and discounted rates for platform members. The physical home of the community the platform builds.</div>
            </div>
            <div className="flywheel-card fw-03">
              <div className="fw-num">03</div>
              <div className="fw-status fw-status-planned">Planned · Year 3</div>
              <div className="fw-title">Collective Loft Records</div>
              <div className="fw-sub">Independent Label</div>
              <div className="fw-desc">Artist-first independent label built on the network and studio. Signing artists already known from the platform. Starting royalty splits at 50/50. Shorter contracts. More ownership retained by artists. The label where careers are built, not extracted.</div>
            </div>
            <div className="flywheel-card fw-04">
              <div className="fw-num">04</div>
              <div className="fw-status fw-status-planned">Planned · Year 3&ndash;4</div>
              <div className="fw-title">Collective Loft Publishing</div>
              <div className="fw-sub">Music · Literary · Art · Collaborative</div>
              <div className="fw-desc">A full creative publishing house. Music publishing and sync licensing. Literary publishing for writers and poets. Art books and monographs for visual artists. Collaborative works that cross disciplines — unique to the Collective Loft ecosystem.</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="faq-inner reveal">
          <div className="section-eyebrow">Questions</div>
          <h2 className="section-title">What you should<br/>know <em>before you join.</em></h2>
          <div className="faq-list">
            <div className="faq-item">
              <div className="faq-q">Why does Collective Loft have a subscription?</div>
              <div className="faq-a">Because free platforms attract people who aren&rsquo;t serious. The $15/month is what keeps this a professional environment, a room where everyone has skin in the game, agreements are in writing before work starts, and your creative work is protected from day one.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">What does $15/month actually get me?</div>
              <div className="faq-a">Everything. No tiers, no feature gates, no pay-to-unlock. Full access to Discover, Collab Briefs, Discipline Matching, Collab Terms, and the Loft Studio. Use it to run 10 collabs a month or use it to build your profile and get discovered. The platform works on your timeline and priorities.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">What about founding members?</div>
              <div className="faq-a">Founding members get 3 months free, no charge, no catch. After that it&rsquo;s $15/month, same as everyone else. The founding member badge on your profile stays forever.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="waitlist-section" id="waitlist">
        <div className="waitlist-inner">
          <span className="waitlist-mark">✦</span>
          <div className="section-eyebrow" style={{textAlign:'center',marginBottom:'1.25rem'}}>Early access</div>
          <h2 className="section-title">The platform is built.<br/><em>We&rsquo;re selecting founding members.</em></h2>
          <p className="section-body" style={{margin:'0 auto'}}>We&rsquo;re not doing an open beta. We&rsquo;re building the founding cohort by hand — across disciplines, across cities, with people who are actively making work right now. Founding members shape the platform.</p>

          <form className="waitlist-form" id="waitlistForm">
            <div className="form-row">
              <input className="form-input" type="text" name="firstname" placeholder="First name" required />
              <input className="form-input" type="text" name="lastname" placeholder="Last name" required />
            </div>
            <input className="form-input" type="email" name="email" placeholder="Your email" required />
            <select className="form-select" name="discipline" required defaultValue="">
              <option value="" disabled>Your primary discipline</option>
              <option>Visual Artist</option>
              <option>Musician / Producer</option>
              <option>Writer / Poet</option>
              <option>Designer / Web</option>
              <option>Filmmaker</option>
              <option>Photographer</option>
              <option>Performance</option>
              <option>Creative Tech</option>
              <option>Other</option>
            </select>
            <input className="form-input" type="text" name="city" placeholder="Your city" />
            <button className="form-submit" type="submit">Request early access ↗</button>
          </form>

          <div className="success-msg" id="successMsg">
            <strong style={{color:'var(--teal)'}}>You&rsquo;re in.</strong><br/>
            Founding member request received. We&rsquo;ll be in touch with next steps before anyone else hears about it.
          </div>

          <div className="waitlist-fine">500 founding spots. We read every application. · <a href="mailto:help@collectiveloft.com" style={{color:'inherit'}}>help@collectiveloft.com</a></div>
        </div>
      </section>

      <footer>
        <a href="/" className="footer-logo">Collective <span>Loft</span></a>
        <div className="footer-links">
          <a href="#how-it-works" className="footer-link">How it works</a>
          <a href="#waitlist" className="footer-link">Early access</a>
          <a href="https://www.instagram.com/the.collective.loft" target="_blank" rel="noopener noreferrer" className="footer-link">Instagram</a>
          <a href="mailto:help@collectiveloft.com" className="footer-link">Contact</a>
        </div>
        <div className="footer-copy">© 2026 Morgan Collective Group LLC</div>
      </footer>

      <script dangerouslySetInnerHTML={{__html: `
        const modal     = document.getElementById('demoModal');
        const demoFrame = document.getElementById('demoFrame');
        const btnOpen   = document.getElementById('btnSeeHowItWorks');
        const btnClose  = document.getElementById('demoClose');

        function openDemo() {
          if (!demoFrame.src || demoFrame.src === window.location.href) {
            demoFrame.src = '/demo.html';
          }
          modal.classList.add('open');
          document.body.style.overflow = 'hidden';
        }

        function closeDemo() {
          modal.classList.remove('open');
          document.body.style.overflow = '';
          setTimeout(() => { demoFrame.src = ''; }, 400);
        }

        btnOpen.addEventListener('click', openDemo);
        btnClose.addEventListener('click', closeDemo);
        modal.addEventListener('click', e => { if (e.target === modal) closeDemo(); });
        document.addEventListener('keydown', e => {
          if (e.key === 'Escape' && modal.classList.contains('open')) closeDemo();
        });

        const reveals = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver(entries => {
          entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
          });
        }, { threshold: 0.1 });
        reveals.forEach(r => observer.observe(r));

        const form = document.getElementById('waitlistForm');
        const success = document.getElementById('successMsg');
        if (form) {
          form.addEventListener('submit', async e => {
            e.preventDefault();
            const btn = form.querySelector('.form-submit');
            btn.textContent = 'Sending…';
            btn.disabled = true;
            const data = {
              firstname: form.firstname.value.trim(),
              lastname: form.lastname.value.trim(),
              email: form.email.value.trim(),
              discipline: form.discipline.value,
              city: form.city.value.trim(),
            };
            try {
              const res = await fetch('https://formspree.io/f/mojrrkdg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(data),
              });
              if (res.ok) {
                form.style.display = 'none';
                success.style.display = 'block';
              } else {
                btn.textContent = 'Request early access ↗';
                btn.disabled = false;
                alert('Something went wrong. Email us directly at help@collectiveloft.com');
              }
            } catch {
              btn.textContent = 'Request early access ↗';
              btn.disabled = false;
              alert('Something went wrong. Email us directly at help@collectiveloft.com');
            }
          });
        }
      `}} />
    </>
  )
}
