# Use a more recent Fluentd image based on Debian
FROM fluent/fluentd:v1.14-debian

# Switch to root user to install plugins
USER root

# Update package lists
RUN apt-get update

# Install build-essential
RUN apt-get install -y --no-install-recommends build-essential

RUN apt-get install -y --no-install-recommends curl git autoconf bison  libssl-dev libyaml-dev libreadline6-dev zlib1g-dev libncurses5-dev libffi-dev libgdbm6 libgdbm-dev libdb-dev
# Install ruby-dev
RUN curl -fsSL https://github.com/rbenv/rbenv-installer/raw/HEAD/bin/rbenv-installer | bash

RUN ruby --version

# Install libffi-dev
RUN apt-get install -y --no-install-recommends libffi-dev

# Clean up apt cache
RUN rm -rf /var/lib/apt/lists/*

RUN gem install faraday -v 2.8.1

RUN gem install faraday-net_http -v 3.0.2

# Install fluent-plugin-elasticsearch
RUN gem install fluent-plugin-elasticsearch

# Install fluent-plugin-grafana-loki
RUN gem install fluent-plugin-grafana-loki

# Clear gem sources
RUN gem sources --clear-all

# Remove gem cache
RUN rm -rf /var/lib/gems/*/cache/*.gem

# Autoremove unnecessary packages
RUN apt-get autoremove -y

# Clean apt cache
RUN apt-get clean

# Remove apt lists
RUN rm -rf /var/lib/apt/lists/*

# Switch back to fluent user
USER fluent

# Set the entrypoint back to fluentd
ENTRYPOINT ["tini", "--", "/bin/entrypoint.sh"]
CMD ["fluentd"]