#!/usr/bin/env bash
set -e
npx newman run ../collections/profile.collection.json -e ../environments/local.json
