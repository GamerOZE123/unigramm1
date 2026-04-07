

## SEO Fixes for Unigramm

### Current Issues
1. **Poor meta tags** — title is just "Unigramm", description is "Its the app", author is "Lovable"
2. **OG image** points to a generic Lovable preview screenshot, not branded
3. **Twitter site** is `@lovable_dev` instead of Unigramm's handle
4. **No sitemap.xml** — search engines can't discover pages
5. **No canonical URL** or `og:url` set properly
6. **No favicon** properly set (no `<link rel="icon">`)
7. **No react-helmet** — SPA pages all share the same generic meta tags; no per-page SEO
8. **robots.txt** has no sitemap reference

### Plan

#### 1. Fix `index.html` meta tags
- Title: "Unigramm — Your Campus, Supercharged"
- Description: proper marketing copy about the platform
- Update `og:title`, `og:description`, `twitter:title`, `twitter:description`
- Change `twitter:site` from `@lovable_dev` to Unigramm's Twitter handle (or remove)
- Remove `meta author Lovable`
- Add canonical URL `<link rel="canonical" href="https://unigramm1.lovable.app/" />`
- Add `og:url`
- Add proper favicon link if an icon exists in assets
- Add keywords meta tag

#### 2. Add `react-helmet-async` for per-page SEO
- Install `react-helmet-async`
- Wrap App in `HelmetProvider`
- Add `<Helmet>` to key public pages:
  - Landing/Index: main marketing SEO
  - `/support`, `/privacy-policy`, `/child-safety`, `/contribute`, `/delete-account` — proper titles
  - `/post/:postId` — dynamic title (already handled by share-post edge function for crawlers, but good for in-app)

#### 3. Create `public/sitemap.xml`
- List all public routes: `/`, `/login`, `/signup`, `/contribute`, `/support`, `/privacy-policy`, `/child-safety`, `/delete-account`, `/waitlist`, `/android-beta`
- Set lastmod, priority values

#### 4. Update `robots.txt`
- Add `Sitemap: https://unigramm1.lovable.app/sitemap.xml`

### Technical Details

**Files to create:**
- `public/sitemap.xml`

**Files to modify:**
- `index.html` — rewrite meta tags
- `public/robots.txt` — add sitemap reference
- `package.json` — add `react-helmet-async`
- `src/App.tsx` — wrap with `HelmetProvider`
- `src/pages/Landing.tsx` (or `Index.tsx`) — add `<Helmet>` with landing page SEO
- Key public pages — add `<Helmet>` with appropriate titles/descriptions

