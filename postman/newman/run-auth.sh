#!/usr/bin/env bash
set -e
npx newman run ../collections/auth.collection.json -e ../environments/local.json
