"""
test_07_gestion_clients.py
Scénario 7 : Gestion des comptes clients côté administrateur
"""

import time
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from selenium.webdriver.common.by import By
from pages.admin_clients_page import AdminClientsPage


class TestGestionClients:

    # ------------------------------------------------------------------
    # 7.1 — Page /admin/clients accessible et affiche la liste
    # ------------------------------------------------------------------
    def test_01_page_clients_accessible(self, driver_admin):
        """La page de gestion des clients est accessible et liste les utilisateurs."""
        driver = driver_admin
        clients_page = AdminClientsPage(driver)
        clients_page.ouvrir()

        assert clients_page.est_sur_page_clients_admin(), (
            f"L'URL doit contenir /admin/clients. URL actuelle: {driver.current_url}"
        )
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert len(body_text.strip()) > 0, "La page /admin/clients ne doit pas être vide"
        indicateurs = ["utilisateurs", "clients", "rôle", "statut", "inscription", "actions"]
        trouve = any(ind.lower() in body_text.lower() for ind in indicateurs)
        assert trouve, "La page doit afficher les colonnes de gestion des clients"

    # ------------------------------------------------------------------
    # 7.2 — L'administrateur apparaît et n'a pas de bouton Désactiver
    # ------------------------------------------------------------------
    def test_02_admin_non_desactivable(self, driver_admin):
        """L'administrateur est affiché mais protégé : aucun bouton Désactiver pour lui."""
        driver = driver_admin
        clients_page = AdminClientsPage(driver)
        clients_page.ouvrir()

        assert clients_page.admin_a_pas_de_bouton_desactiver(), (
            "Le compte administrateur ne doit pas posséder de bouton Désactiver"
        )

    # ------------------------------------------------------------------
    # 7.3 — Boutons Désactiver présents sur les comptes clients
    # ------------------------------------------------------------------
    def test_03_boutons_desactiver_visibles_sur_clients(self, driver_admin):
        """Des boutons 'Désactiver' sont présents pour les comptes clients réguliers."""
        driver = driver_admin
        clients_page = AdminClientsPage(driver)
        clients_page.ouvrir()

        btns_desactiver = driver.find_elements(By.XPATH,
            "//button[contains(text(),'Désactiver') or contains(text(),'desactiver')]"
        )
        assert len(btns_desactiver) > 0, (
            "Au moins un bouton Désactiver doit être visible pour les clients"
        )

    # ------------------------------------------------------------------
    # 7.4 — Recherche ou filtrage des clients
    # ------------------------------------------------------------------
    def test_04_recherche_client(self, driver_admin):
        """Le champ de recherche permet de filtrer les clients."""
        driver = driver_admin
        clients_page = AdminClientsPage(driver)
        clients_page.ouvrir()

        champs_recherche = driver.find_elements(By.CSS_SELECTOR,
            "input[type='search'], input[type='text'][placeholder*='Rechercher'], input[placeholder*='nom']"
        )
        if champs_recherche:
            champs_recherche[0].clear()
            champs_recherche[0].send_keys("nassima")
            time.sleep(1)
            body_text = driver.find_element(By.TAG_NAME, "body").text
            assert "nassima" in body_text.lower(), (
                "Les résultats de recherche doivent inclure 'nassima'"
            )
        else:
            # Si pas de barre de recherche spécifique, vérifie que le tableau affiche bien des clients
            assert clients_page.nombre_utilisateurs() > 0, "Des clients doivent être présents dans le tableau"
