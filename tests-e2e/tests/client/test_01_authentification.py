"""
test_01_authentification.py
Scénario 1 : Connexion, déconnexion, inscription, accès refusé
"""

import time
import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from selenium.webdriver.common.by import By
from pages.login_page import LoginPage
from pages.register_page import RegisterPage
from pages.home_page import HomePage


class TestAuthentification:

    # ------------------------------------------------------------------
    # 1.1 — Accéder à /login : page de connexion affichée
    # ------------------------------------------------------------------
    def test_01_page_login_accessible(self, driver):
        """La page de connexion se charge correctement."""
        login = LoginPage(driver)
        login.ouvrir()
        assert "/login" in driver.current_url, "L'URL doit contenir /login"
        titre = driver.find_element(By.CSS_SELECTOR, ".auth-title")
        assert titre.is_displayed(), "Le titre de la page de connexion doit être visible"
        assert "Connexion" in titre.text, "Le titre doit contenir 'Connexion'"

    # ------------------------------------------------------------------
    # 1.2 — Connexion avec identifiants valides (client)
    # ------------------------------------------------------------------
    def test_02_connexion_client_valide(self, driver):
        """Un client peut se connecter avec des identifiants corrects."""
        login = LoginPage(driver)
        login.ouvrir()
        login.se_connecter("nassima@example.com", "password123")
        assert login.est_connecte(), (
            f"Après connexion, l'URL ne doit plus être /login. URL actuelle: {driver.current_url}"
        )

    # ------------------------------------------------------------------
    # 1.3 — Connexion avec mauvais mot de passe
    # ------------------------------------------------------------------
    def test_03_connexion_mauvais_mot_de_passe(self, driver):
        """Un message d'erreur est affiché en cas de mauvais identifiants."""
        login = LoginPage(driver)
        login.ouvrir()
        login.se_connecter("nassima@example.com", "mauvais_mot_de_passe_xyz")
        assert login.est_sur_page_login(), "L'utilisateur doit rester sur /login"
        erreur = login.message_erreur()
        assert erreur != "", f"Un message d'erreur doit être affiché, obtenu: '{erreur}'"

    # ------------------------------------------------------------------
    # 1.4 — Accéder à /register : formulaire visible
    # ------------------------------------------------------------------
    def test_04_page_register_accessible(self, driver):
        """La page d'inscription se charge correctement."""
        register = RegisterPage(driver)
        register.ouvrir()
        assert "/register" in driver.current_url, "L'URL doit contenir /register"
        titre = driver.find_element(By.CSS_SELECTOR, ".auth-title")
        assert titre.is_displayed(), "Le titre de la page d'inscription doit être visible"

    # ------------------------------------------------------------------
    # 1.5 — Inscription avec données valides
    # ------------------------------------------------------------------
    def test_05_inscription_compte_valide(self, driver):
        """Un nouvel utilisateur peut s'inscrire avec des données valides."""
        import random
        import string
        # Email unique à chaque exécution pour éviter les doublons
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        email_test = f"selenium_{random_suffix}@test.com"

        register = RegisterPage(driver)
        register.ouvrir()
        register.s_inscrire(
            nom="Selenium Test",
            email=email_test,
            password="TestPass123!",
        )
        # Après inscription réussie : redirection hors de /register
        assert register.est_inscrit(), (
            f"Après inscription, l'URL ne doit plus être /register. URL: {driver.current_url}"
        )

    # ------------------------------------------------------------------
    # 1.6 — Déconnexion
    # ------------------------------------------------------------------
    def test_06_deconnexion(self, driver_client):
        """Un client connecté peut se déconnecter."""
        driver = driver_client
        # On est connecté, on cherche le bouton Déconnexion
        time.sleep(1)
        btns_deconnexion = driver.find_elements(By.XPATH,
            "//*[contains(text(),'Déconnexion') or contains(text(),'deconnexion') or contains(text(),'Logout')]"
        )
        assert len(btns_deconnexion) > 0, "Le bouton Déconnexion doit être visible pour un utilisateur connecté"
        btns_deconnexion[0].click()
        time.sleep(2)
        # Après déconnexion : on doit être redirigé hors de l'espace connecté
        url = driver.current_url
        assert "/admin" not in url, "Après déconnexion, l'accès à /admin doit être interdit"

    # ------------------------------------------------------------------
    # 1.7 — Accès à /admin sans être admin doit être bloqué
    # ------------------------------------------------------------------
    def test_07_acces_admin_sans_permission(self, driver):
        """Un visiteur non connecté ne peut pas accéder à /admin."""
        driver.get("http://localhost:3000/admin")
        time.sleep(2)
        url = driver.current_url
        # Doit être redirigé vers /login ou page d'accueil
        assert "/admin" not in url or "login" in url, (
            f"Un non-admin ne devrait pas avoir accès à /admin. URL: {url}"
        )
