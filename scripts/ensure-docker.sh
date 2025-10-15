#!/bin/bash

# Skip Docker checks when running in CI
if [ "$CI" = "true" ]; then
  echo "Running in CI environment, skipping Docker checks"
  exit 0
fi

if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please ensure Docker is running and try again."
  exit 1
else
  echo "Docker is running. Continuing..."
fi
