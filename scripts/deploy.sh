#!/bin/bash
set -e

echo "Building..."
npm run build

echo "Staging docs/"
git add docs/

if git diff --cached --quiet; then
  echo "No changes to deploy"
  exit 0
fi

echo "Committing..."
git commit -m "Build: update GitHub Pages"

echo "Pushing..."
git push origin main

echo "Deployed! https://itskreisler.github.io/fnsprites/"
