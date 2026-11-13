#!/bin/sh
# Build the site and keep the static root index.html in sync.
# The root index.html is a pre-built copy of the homepage served at
# muleai.io; its "Latest from the Mule Blog" cards are derived from the
# newest posts, so it must be refreshed whenever `hugo` runs.
set -eu
cd "$(dirname "$0")"
hugo "$@"
if [ -f public/index.html ]; then
    cp public/index.html index.html
    echo "Synced static homepage copy: index.html"
fi
