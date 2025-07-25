#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Deploying Laser Llama Rampage to Netlify..."

# Try to deploy directly
netlify deploy --dir . --prod --open

echo "✅ Deployment complete! Check your browser for the live site."