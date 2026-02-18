#!/usr/bin/env bash
set -e
npx newman run ../collections/audio.collection.json -e ../environments/local.json
