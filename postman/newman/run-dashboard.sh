#!/usr/bin/env bash
set -e
npx newman run ../collections/dashboard.collection.json -e ../environments/local.json
