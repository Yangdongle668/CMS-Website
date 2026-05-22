# Self-hosted seed imagery

Populated by `npm run images:localize`. The script downloads every
`images.unsplash.com/photo-*` reference found in HTML / SQL / CSS / JS
sources to this folder, then rewrites references to point here instead
of the Unsplash CDN.

Re-run any time content references a new external URL.
