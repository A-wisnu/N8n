# Use official n8n image as base
FROM n8nio/n8n:latest

# Set working directory
WORKDIR /home/node

# Copy workflow files
COPY workflows/ /home/node/.n8n/workflows/

# Set environment variables
ENV N8N_BASIC_AUTH_ACTIVE=false
ENV N8N_HOST=0.0.0.0
ENV N8N_PORT=5678
ENV N8N_PROTOCOL=http
ENV WEBHOOK_URL=https://production-n8n-url.railway.app
ENV N8N_EDITOR_BASE_URL=/
ENV N8N_DISABLE_UI=false
ENV N8N_METRICS=false
ENV EXECUTIONS_PROCESS=main
ENV EXECUTIONS_MODE=regular
ENV N8N_LOG_LEVEL=info
ENV N8N_LOG_OUTPUT=console
ENV GENERIC_TIMEZONE=Asia/Jakarta

# Install additional packages if needed
USER root
RUN apk add --no-cache \
    tzdata \
    curl \
    && cp /usr/share/zoneinfo/Asia/Jakarta /etc/localtime \
    && echo "Asia/Jakarta" > /etc/timezone

# Switch back to node user
USER node

# Expose port
EXPOSE 5678

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5678/healthz || exit 1

# Start n8n
CMD ["n8n", "start"]