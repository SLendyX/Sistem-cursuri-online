# Folosim o imagine oficială Node.js
FROM node:18-alpine

# Setăm directorul de lucru
WORKDIR /app

# Copiem fișierele de dependențe
COPY package*.json ./

# Instalăm dependențele
RUN npm install

# Copiem restul codului sursă
COPY . .

# Expunem portul pe care rulează serverul (5000 din server.js)
EXPOSE 5000

# Comanda de start
CMD ["node", "server.js"]