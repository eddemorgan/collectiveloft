# Collective Loft

Next.js 15.5 (App Router) on React 19. Plain JavaScript, no TypeScript. Deploys to Vercel.
Structured agreement infrastructure for the creative class.

## Commands
- npm run dev — local dev server at localhost:3000
- npm run build — production build
- npm start — serve the production build

## Structure
- /app/page.js — the full landing page. Large single file. When changing a section, target that section, not the whole file.
- /app/layout.js — root layout.
- /app/blog — blog route.
- /app/globals.css — global base styles.
- /app/landing.module.css — CSS Module scoped to the landing page.
- /posts — blog posts as markdown files. To add a post, create a new .md file here.
- /lib/posts.js — reads and parses markdown from /posts. Touch only if changing how posts load.
- /public — static assets.

## Conventions
- Styling is CSS Modules plus globals.css. No Tailwind, no CSS-in-JS. Match the existing approach.
- No new dependencies without flagging it first and explaining why.
- App Router patterns. Server components by default.
- The standalone landing HTML file is a legacy static draft. The live site is the Next app. Do not edit the HTML file unless asked.

## Voice (any copy, blog post, or marketing text)
Write like Edde talks. Short punchy sentences mixed with longer ones when making a point. Confident and direct, evidence over assertion, no hedging. Kara Swisher meets Scott Galloway.
- No em dashes.
- No bullet points unless asked.
- No filler: particular, specific, it's worth noting, quality of.
- Concrete over abstract. Show the thing, do not describe the concept of the thing. Lead with the image.
- Quick dismissal then expert depth. Let the heat through when indicting something fake.
- Replace vague placeholders like things or stuff with the precise noun: risks, dependencies, failure points, controls.
