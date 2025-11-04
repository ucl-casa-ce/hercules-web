#!/bin/bash
set -e

# Start PostgreSQL
service postgresql start

# Start NGINX
service nginx restart

# Run the node application
cd /opt/viz && npm start
