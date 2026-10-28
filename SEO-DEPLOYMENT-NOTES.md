# Pyvanta SEO deployment notes

Includes homepage title/description, canonical URL, social metadata, Organization/WebSite JSON-LD, robots.txt and sitemap.xml.

After deploying, verify /robots.txt and /sitemap.xml, add https://pyvanta.vercel.app/ in Google Search Console, submit the sitemap, then inspect the homepage and request indexing.

Only the homepage is included because no separate public SEO pages are assumed. robots.txt is not a security mechanism; keep app/Firebase access controls enabled. Metadata cannot guarantee rankings.
