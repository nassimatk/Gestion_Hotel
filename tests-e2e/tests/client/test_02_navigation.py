"""
test_02_navigation.py
Scénario 2 : Navigation publique et consultation des pages
"""

import time
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from selenium.webdriver.common.by import By
from pages.home_page import HomePage
from pages.chambres_page import ChambresPage


class TestNavigation:

    # ------------------------------------------------------------------
    # 2.1 — Page d'accueil accessible
    # ------------------------------------------------------------------
    def test_01_page_accueil_accessible(self, driver):
        """La page d'accueil se charge et affiche du contenu."""
        home = HomePage(driver)
        home.ouvrir()
        time.sleep(2)
        assert "localhost:3000" in driver.current_url, "Doit être sur localhost:3000"
        # Vérifie qu'il y a du contenu (navbar, hero, etc.)
        body = driver.find_element(By.TAG_NAME, "body")
        assert body.is_displayed(), "Le corps de la page doit être visible"
        # Vérifie que la page n'est pas vide
        assert len(body.text.strip()) > 0, "La page d'accueil ne doit pas être vide"

    # ------------------------------------------------------------------
    # 2.2 — Page /chambres affiche la liste des chambres
    # ------------------------------------------------------------------
    def test_02_page_chambres_affiche_liste(self, driver):
        """La page /chambres charge et affiche des chambres."""
        chambres = ChambresPage(driver)
        chambres.ouvrir()
        time.sleep(3)
        assert "/chambres" in driver.current_url, "Doit être sur /chambres"
        # Vérifie que la page contient du contenu sur les chambres
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert len(body_text) > 100, "La page chambres doit afficher du contenu"
        # Cherche des éléments de chambre (numéro, type, prix...)
        indicateurs = ["101", "102", "simple", "double", "suite", "nuit", "€", "DA", "MAD"]
        trouve = any(ind.lower() in body_text.lower() for ind in indicateurs)
        assert trouve, "La page /chambres doit afficher des informations sur les chambres"

    # ------------------------------------------------------------------
    # 2.3 — Cliquer sur une chambre ouvre son détail
    # ------------------------------------------------------------------
    def test_03_detail_chambre_accessible(self, driver):
        """Cliquer sur une chambre ouvre sa page de détail."""
        chambres = ChambresPage(driver)
        chambres.ouvrir()
        time.sleep(3)
        # Cherche un lien vers le détail d'une chambre
        liens = driver.find_elements(By.XPATH,
            "//a[contains(@href,'/chambres/') or contains(@href,'/reservation')]"
        )
        if liens:
            href = liens[0].get_attribute("href")
            liens[0].click()
            time.sleep(2)
            url = driver.current_url
            assert "/chambres/" in url or "/reservation" in url, (
                f"Doit naviguer vers le détail d'une chambre. URL: {url}"
            )
        else:
            # Pas de lien direct, test que la page contient des cartes chambres
            body_text = driver.find_element(By.TAG_NAME, "body").text
            assert "chambre" in body_text.lower() or "room" in body_text.lower(), \
                "La page doit au moins afficher des chambres"

    # ------------------------------------------------------------------
    # 2.4 — Page /tarifs accessible
    # ------------------------------------------------------------------
    def test_04_page_tarifs_accessible(self, driver):
        """La page /tarifs se charge et affiche les tarifs."""
        driver.get("http://localhost:3000/tarifs")
        time.sleep(3)
        assert "/tarifs" in driver.current_url, "Doit être sur /tarifs"
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert len(body_text.strip()) > 0, "La page tarifs ne doit pas être vide"
        # Vérifie la présence de contenu lié aux tarifs
        indicateurs = ["tarif", "prix", "nuit", "chambre", "type", "€", "MAD", "DA"]
        trouve = any(ind.lower() in body_text.lower() for ind in indicateurs)
        assert trouve, "La page /tarifs doit afficher des informations tarifaires"

    # ------------------------------------------------------------------
    # 2.5 — Navbar contient les liens attendus
    # ------------------------------------------------------------------
    def test_05_navbar_liens_visibles(self, driver):
        """La barre de navigation contient les liens principaux."""
        home = HomePage(driver)
        home.ouvrir()
        time.sleep(2)
        body_text = driver.find_element(By.TAG_NAME, "body").text
        # Vérifie que les liens de navigation principaux sont présents
        liens_attendus = ["Accueil", "Chambres"]
        for lien in liens_attendus:
            assert lien in body_text or lien.lower() in body_text.lower(), \
                f"Le lien '{lien}' doit être présent dans la navbar"
