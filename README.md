# Vizancia website

This is a dependency-free static website for Vizancia. It can be hosted from the repository root (including GitHub Pages) without a build step.

## Structure

- `index.html`, `campus.html`, `learn.html`, `parents/`, `homeschool/`, and `programs.html` are the current marketing landing pages. The Programs page presents guided workplace, family, homeschool, coaching, and web-only incubator offers through an email-based enquiry flow. The Campus and Learn & Train experiences use `assets/campus.css` and `assets/learn.css`; the parent experience keeps its layout and interactions in `parents/parents.css` and `parents/parents.js`.
- `resources/` is the AI Learning Hub. Pages share `resources/resources.css` and `resources/resources.js`, and research articles link to their primary sources.
- `about.html`, `methodology.html`, `editorial-policy.html`, `accessibility.html`, and `changelog.html` are technical trust pages.
- `assets/privacy-consent.js` and `assets/privacy-consent.css` are the shared website consent implementation. Google Ads measurement must remain behind the consent flow.
- `sitemap.xml`, `robots.txt`, and `404.html` are deployment metadata and error handling.

## Publishing checklist

1. Update the visible review date and `sitemap.xml` when a page changes.
2. Keep product claims tied to a current app-store listing, screenshot, or internal release note. Do not add ratings, testimonials, credentials, or performance claims without verification.
3. For research-based articles, preserve the source link and identify the source’s audience, date, and limitations.
4. Test keyboard navigation, reduced motion, narrow mobile widths, the privacy choices control, and both store links before publishing.
5. Have the privacy policy, consent implementation, and terms reviewed by qualified counsel for the jurisdictions where you advertise.
6. Before accepting payment for a guided program, confirm the written scope, taxes, participant or licence limits, payment method, cancellation terms, third-party costs, and delivery details described on the Programs page.

## Visual direction

- Treat the Campus and virtual-world experience as the benchmark for the site's personality: playful, exploratory, and grounded in the real product.
- Prefer real app screenshots paired with world-building, pathways, and clear movement through the experience.
- Use original character art as guides or wayfinding, not as unrelated decoration.
- Keep the surrounding marketing layout clean and credible. Avoid templated status pills, excessive badges, generic AI imagery, and gratuitous glass or gradient effects.
- The Learn experience should visibly communicate its winding path of connected lesson nodes and the feeling of making progress through a journey.

## Maintainability roadmap

The site currently has repeated navigation and footer markup in legacy pages. The new resource and trust pages share a CSS vocabulary but remain plain HTML so they can deploy immediately. The next maintainability step should be a small static-site generator (Eleventy or Astro) with shared partials for navigation, footer, metadata, and consent. Migrate one page at a time, compare rendered output, then remove duplicated templates once the generated pages are verified.
