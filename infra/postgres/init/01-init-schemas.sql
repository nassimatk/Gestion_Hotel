-- Execute une seule fois, a la creation du volume PostgreSQL.
-- Une base (hotel_db), UN SCHEMA et UN UTILISATEUR par microservice.
-- Mots de passe de DEVELOPPEMENT : a garder synchronises avec .env.

-- 1. Creation des schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS chambres;
CREATE SCHEMA IF NOT EXISTS avis;
CREATE SCHEMA IF NOT EXISTS disponibilites;
CREATE SCHEMA IF NOT EXISTS tarifs;

-- 2. Creation des utilisateurs (s'ils n'existent pas deja)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'auth_user') THEN
        CREATE USER auth_user WITH PASSWORD 'auth_pass';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'chambres_user') THEN
        CREATE USER chambres_user WITH PASSWORD 'chambres_pass';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'avis_user') THEN
        CREATE USER avis_user WITH PASSWORD 'avis_pass';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'disponibilites_user') THEN
        CREATE USER disponibilites_user WITH PASSWORD 'disponibilites_pass';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tarifs_user') THEN
        CREATE USER tarifs_user WITH PASSWORD 'tarifs_pass';
    END IF;
END
$$;

-- 3. Droits d'acces exclusifs par schema
GRANT ALL ON SCHEMA auth           TO auth_user;
GRANT ALL ON SCHEMA chambres       TO chambres_user;
GRANT ALL ON SCHEMA avis           TO avis_user;
GRANT ALL ON SCHEMA disponibilites TO disponibilites_user;
GRANT ALL ON SCHEMA tarifs         TO tarifs_user;

-- 4. Droits par defaut sur les tables et sequences futures (pour les migrations)
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO auth_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON SEQUENCES TO auth_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA chambres GRANT ALL ON TABLES TO chambres_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA chambres GRANT ALL ON SEQUENCES TO chambres_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA avis GRANT ALL ON TABLES TO avis_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA avis GRANT ALL ON SEQUENCES TO avis_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA disponibilites GRANT ALL ON TABLES TO disponibilites_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA disponibilites GRANT ALL ON SEQUENCES TO disponibilites_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA tarifs GRANT ALL ON TABLES TO tarifs_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA tarifs GRANT ALL ON SEQUENCES TO tarifs_user;

-- 5. Configuration du search_path par defaut pour chaque role
ALTER ROLE auth_user           SET search_path = auth;
ALTER ROLE chambres_user       SET search_path = chambres;
ALTER ROLE avis_user           SET search_path = avis;
ALTER ROLE disponibilites_user SET search_path = disponibilites;
ALTER ROLE tarifs_user         SET search_path = tarifs;

-- 6. Interdire l'acces au schema public pour les utilisateurs non administrateurs
REVOKE ALL ON SCHEMA public FROM PUBLIC;
