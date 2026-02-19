#!/usr/bin/env bash
set -euo pipefail

npx newman run ../collections/streaming_share.collection.json -e ../environments/local.json
