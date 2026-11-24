"""
test_08_gestion_avis.py
Scénario 8 : Gestion et modération des avis côté administrateur
"""

import time
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from selenium.webdriver.common.by import By
from pages.admin_avis_page import AdminAvisPage


class TestGestionAvis:

    # ------------------------------------------------------------------
    # 8.1 — Page /admin/avis accessible
    # ------------------------------------------------------------------
    def test_01_page_avis_admin_accessible(self, driver_admin):
        """La page d'administration des avis est accessible."""
        driver = driver_admin
        avis_page = AdminAvisPage(driver)
        avis_page.ouvrir()

        assert avis_page.est_sur_page_avis_admin(), (
            f"L'URL doit contenir /admin/avis. URL actuelle: {driver.current_url}"
        )
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert len(body_text.strip()) > 0, "La page /admin/avis ne doit pas être vide"
        indicateurs = ["avis", "commentaires", "note", "satisfaction", "modération"]
        trouve = any(ind.lower() in body_text.lower() for ind in indicateurs)
        assert trouve, "La page /admin/avis doit afficher des indicateurs d'avis"

    # ------------------------------------------------------------------
    # 8.2 — Affichage de la note moyenne ou des statistiques
    # ------------------------------------------------------------------
    def test_02_note_moyenne_ou_stats_visibles(self, driver_admin):
        """Des indicateurs de synthèse (note globale, statistiques) sont affichés."""
        driver = driver_admin
        avis_page = AdminAvisPage(driver)
        avis_page.ouvrir()

        body_text = driver.find_element(By.TAG_NAME, "body").text
        indicateurs_stats = ["/5", "note", "étoile", "avis", "positif", "%", "total"]
        trouve = any(ind.lower() in body_text.lower() for ind in indicateurs_stats)
        assert trouve, "Des statistiques ou notes moyennes doivent être affichées sur les avis"

    # ------------------------------------------------------------------
    # 8.3 — Présence de la liste des avis ou état vide propre
    # ------------------------------------------------------------------
    def test_03_liste_avis_ou_etat_vide(self, driver_admin):
        """La liste des avis reçus est affichée avec les commentaires ou un état vide clair."""
        driver = driver_admin
        avis_page = AdminAvisPage(driver)
        avis_page.ouvrir()

        body_text = driver.find_element(By.TAG_NAME, "body").text
        # Vérifie soit la présence d'avis ou la mention explicite d'avis
        assert "avis" in body_text.lower() or "commentaire" in body_text.lower(), (
            "La section des avis clients doit être clairement présentée"
        )
