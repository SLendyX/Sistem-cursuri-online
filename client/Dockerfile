# Folosim o versiune mai nouă de Node.js compatibilă cu Vite 6+
FROM node:22-alpine

WORKDIR /app

# Copiem dependențele
COPY package*.json ./

RUN npm install

# Copiem codul sursă
COPY . .

# Expunem portul Vite
EXPOSE 5173

# Pornim serverul de dezvoltare
CMD ["npm", "run", "dev", "--", "--host"]