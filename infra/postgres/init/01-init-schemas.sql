-- Execute une seule fois, a la creation du volume PostgreSQL.
-- Une base (hotel_db), UN SCHEMA et UN UTILISATEUR par microservice.
-- Mots de passe de DEVELOPPEMENT : a garder synchronises avec .env.

CREATE SCHEMA auth;
CREATE SCHEMA chambres;
CREATE SCHEMA avis;
CREATE SCHEMA disponibilites;
CREATE SCHEMA tarifs;

CREATE USER auth_user            WITH PASSWORD 'auth_pass';
CREATE USER chambres_user       WITH PASSWORD 'chambres_pass';
CREATE USER avis_user           WITH PASSWORD 'avis_pass';
CREATE USER disponibilites_user WITH PASSWORD 'disponibilites_pass';
CREATE USER tarifs_user         WITH PASSWORD 'tarifs_pass';

-- Chaque utilisateur n'a acces qu'a SON schema
GRANT ALL ON SCHEMA auth           TO auth_user;
GRANT ALL ON SCHEMA chambres       TO chambres_user;
GRANT ALL ON SCHEMA avis           TO avis_user;
GRANT ALL ON SCHEMA disponibilites TO disponibilites_user;
GRANT ALL ON SCHEMA tarifs         TO tarifs_user;

ALTER ROLE auth_user           SET search_path = auth;
ALTER ROLE chambres_user       SET search_path = chambres;
ALTER ROLE avis_user           SET search_path = avis;
ALTER ROLE disponibilites_user SET search_path = disponibilites;
ALTER ROLE tarifs_user         SET search_path = tarifs;

-- Interdire l'acces au schema public
REVOKE ALL ON SCHEMA public FROM PUBLIC;
