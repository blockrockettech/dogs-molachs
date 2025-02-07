#!/usr/bin/env bash

# Version key/value should be on his own line
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

npm run build;

echo "Deploying version $PACKAGE_VERSION to PRODUCTION"
firebase use the-dogs-molochs;
firebase deploy --only hosting:the-dogs-molochs;

