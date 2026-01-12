FROM php:8.2-apache

# Instalăm extensiile necesare pentru conexiunea la baza de date
RUN docker-php-ext-install pdo pdo_mysql

# Activăm mod_rewrite (opțional, dar util pentru proiecte viitoare)
RUN a2enmod rewrite