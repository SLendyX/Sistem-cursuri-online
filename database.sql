CREATE DATABASE IF NOT EXISTS catalog_studenti;
USE catalog_studenti;

CREATE TABLE studenti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nume VARCHAR(100) NOT NULL,
    an INT NOT NULL,
    media DECIMAL(4, 2) NOT NULL
);

-- Inserăm un student de test
INSERT INTO studenti (nume, an, media) VALUES ('Ion Popescu', 2, 8.50);