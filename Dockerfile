FROM php:8.3-cli

# Dépendances système nécessaires pour Oracle Instant Client et OCI8
RUN apt-get update && apt-get install -y \
    unzip \
    wget \
    libaio1t64 \
    libonig-dev \
    build-essential \
    libzip-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Téléchargement et installation d'Oracle Instant Client (Basic Light + SDK)
RUN mkdir -p /opt/oracle && cd /opt/oracle \
    && wget -q https://download.oracle.com/otn_software/linux/instantclient/2326300/instantclient-basiclite-linux.x64-23.26.3.0.0.zip \
    && wget -q https://download.oracle.com/otn_software/linux/instantclient/2326300/instantclient-sdk-linux.x64-23.26.3.0.0.zip \
    && unzip -q -o instantclient-basiclite-linux.x64-23.26.3.0.0.zip \
    && unzip -q -o instantclient-sdk-linux.x64-23.26.3.0.0.zip \
    && rm -f *.zip \
    && mv instantclient_* /opt/oracle/instantclient \
    && echo /opt/oracle/instantclient > /etc/ld.so.conf.d/oracle-instantclient.conf \
    && ldconfig

ENV LD_LIBRARY_PATH=/opt/oracle/instantclient:$LD_LIBRARY_PATH

# Installation de l'extension PHP OCI8 via PECL
RUN printf 'instantclient,/opt/oracle/instantclient\n' | pecl install oci8 \
    && docker-php-ext-enable oci8

# Extensions PHP standard nécessaires pour Laravel
RUN docker-php-ext-install pdo mbstring zip bcmath

# Installation de Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]