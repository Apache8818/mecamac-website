#!/usr/bin/env bash
# ============================================================
# Mecamac — switch the site from TESTING to LIVE.
# Run it once, in the site folder, before uploading to the real domain:
#     bash go-live.sh
# It does three things and nothing else:
#   1. removes the  <meta name="robots" content="noindex, nofollow">  line
#   2. un-comments the  <link rel="canonical">  line on every page
#   3. replaces robots.txt with the live version (allow all + sitemap)
# Re-running it is harmless.
# ============================================================
set -e
cd "$(dirname "$0")"

echo "1/3  removing the noindex meta…"
find . -name '*.html' -not -path './unused-media/*' -print0 | xargs -0 sed -i \
  -e '/⚠️ TESTING PHASE ONLY — REMOVE the next line before launching on the official domain/d' \
  -e '/<meta content="noindex, nofollow" name="robots"\/>/d' \
  -e '/<meta name="robots" content="noindex, nofollow">/d'

echo "2/3  enabling canonical links…"
find . -name '*.html' -not -path './unused-media/*' -print0 | xargs -0 sed -i \
  -e 's|<!-- \(<link rel="canonical" href="https://www.mecamac.com[^>]*>\) -->|\1|'

echo "3/3  writing the live robots.txt…"
cat > robots.txt <<'ROBOTS'
User-agent: *
Allow: /

Sitemap: https://www.mecamac.com/sitemap.xml
ROBOTS

echo
echo "Done. Quick check:"
echo "  noindex left:   $(grep -rl 'noindex' --include='*.html' . | wc -l) page(s)  (should be 0)"
echo "  canonicals on:  $(grep -rl 'rel="canonical"' --include='*.html' . | grep -v unused-media | wc -l) page(s)"
echo
echo "Now upload the whole folder to the hosting, then test:"
echo "  https://www.mecamac.com/            (home)"
echo "  https://www.mecamac.com/sitemap.xml (sitemap)"
echo "  https://www.mecamac.com/robots.txt  (must say Allow: /)"
