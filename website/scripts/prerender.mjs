// Writes one static HTML file per website page into dist/, each with its own
// head tags and the page already rendered, then generates sitemap.xml.
// Runs after `vite build` (client) and `vite build --ssr` (dist-ssr/).
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const ssrDir = join(root, 'dist-ssr');

const { render, SITE_PAGES, APP_URL, SITE_URL, CONTACT_EMAIL, PLAY_STORE_URL, SITE_OWNER } = await import(
  pathToFileURL(join(ssrDir, 'entry-server.js')).href
);

const template = readFileSync(join(dist, 'index.html'), 'utf8');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const urlFor = (path) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`);
const ldJson = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

const OG_IMAGE = `${SITE_URL}/og-image.png`;

/** Structured data: only facts that are true of the product today. */
const structuredData = (page) => {
  if (page.id === 'home') {
    return ldJson({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: SITE_OWNER,
          url: `${SITE_URL}/`,
          logo: `${SITE_URL}/icon-512.png`,
          email: CONTACT_EMAIL,
          contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: CONTACT_EMAIL },
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          name: SITE_OWNER,
          url: `${SITE_URL}/`,
          publisher: { '@id': `${SITE_URL}/#organization` },
        },
        {
          '@type': 'SoftwareApplication',
          name: SITE_OWNER,
          url: `${APP_URL}/`,
          description: page.description,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Web browser, Android',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          installUrl: PLAY_STORE_URL,
          publisher: { '@id': `${SITE_URL}/#organization` },
        },
      ],
    });
  }
  if (!page.indexed) return '';
  return ldJson({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: page.title.replace(/ — NetiSpeed$/, ''), item: urlFor(page.path) },
    ],
  });
};

const headTags = (page, indexed) =>
  [
    indexed ? `<link rel="canonical" href="${urlFor(page.path)}" />` : '<meta name="robots" content="noindex" />',
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${SITE_OWNER}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    indexed ? `<meta property="og:url" content="${urlFor(page.path)}" />` : '',
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="NetiSpeed — Understand your internet. Improve your connection." />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    structuredData(page),
  ]
    .filter(Boolean)
    .map((t) => `  ${t}`)
    .join('\n');

const replaceOnce = (html, pattern, value, what) => {
  if (!pattern.test(html)) throw new Error(`prerender: index.html has no ${what}`);
  return html.replace(pattern, () => value);
};

const build = (page, body, indexed) => {
  let html = template;
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`, '<title>');
  html = replaceOnce(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${esc(page.description)}" />`,
    'meta description',
  );
  html = replaceOnce(html, /<\/head>/, `${headTags(page, indexed)}\n</head>`, '</head>');
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`, 'empty #root');
  return html;
};

// Flat files: Firebase Hosting's cleanUrls serves /about from about.html.
const fileFor = (path) => (path === '/' ? 'index.html' : `${path.slice(1)}.html`);

for (const page of SITE_PAGES) {
  writeFileSync(join(dist, fileFor(page.path)), build(page, render(page.path), page.indexed));
}

const today = new Date().toISOString().slice(0, 10);
// The speed test is its own site (app.netispeed.in) with its own sitemap.
const indexed = SITE_PAGES.filter((p) => p.indexed).map((p) => p.path);
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexed.map((p) => `  <url><loc>${urlFor(p)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`,
);

rmSync(ssrDir, { recursive: true, force: true });
console.log(`prerendered ${SITE_PAGES.length} pages and sitemap.xml (${indexed.length} URLs)`);
