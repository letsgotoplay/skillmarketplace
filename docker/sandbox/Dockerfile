# Skill evaluation sandbox
FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install skills-ref CLI for validation
RUN pip install --no-cache-dir skills-ref

# Create non-root user for security
RUN useradd -m -s /bin/bash sandbox
USER sandbox
WORKDIR /home/sandbox

# Set resource limits via environment
ENV MEMORY_LIMIT=512M
ENV CPU_LIMIT=1
ENV TIMEOUT_SECONDS=60

# Default command
CMD ["sleep", "infinity"]
