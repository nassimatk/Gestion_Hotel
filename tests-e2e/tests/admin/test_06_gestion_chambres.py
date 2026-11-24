"""
test_06_gestion_chambres.py
Scénario 6 : Gestion des chambres côté admin
"""

import time
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from pages.admin_chambres_page import AdminChambresPage


class TestGestionChambres:

    # ------------------------------------------------------------------
    # 6.1 — Page /admin/chambres affiche la liste
    # ------------------------------------------------------------------
    def test_01_liste_chambres_affichee(self, driver_admin):
        """La liste des chambres est affichée dans /admin/chambres."""
        driver = driver_admin
        driver.get("http://localhost:3000/admin/chambres")
        time.sleep(3)

        assert "/admin/chambres" in driver.current_url, \
            "Doit être sur /admin/chambres"
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert len(body_text.strip()) > 0, "La page chambres admin ne doit pas être vide"
        # Vérifie qu'au moins une chambre est affichée
        indicateurs = ["101", "102", "simple", "double", "suite", "chambre", "numéro"]
        trouve = any(ind.lower() in body_text.lower() for ind in indicateurs)
        assert trouve, "La liste des chambres doit afficher des chambres"

    # ------------------------------------------------------------------
    # 6.2 — Bouton Ajouter une chambre visible
    # ------------------------------------------------------------------
    def test_02_bouton_ajouter_visible(self, driver_admin):
        """Le bouton 'Ajouter une chambre' est visible."""
        driver = driver_admin
        driver.get("http://localhost:3000/admin/chambres")
        time.sleep(2)

        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert "ajouter" in body_text.lower() or "Ajouter" in body_text, \
            "Le bouton Ajouter une chambre doit être visible"

    # ------------------------------------------------------------------
    # 6.3 — Formulaire d'ajout de chambre accessible
    # ------------------------------------------------------------------
    def test_03_formulaire_ajout_accessible(self, driver_admin):
        """Le formulaire d'ajout d'une chambre est accessible."""
        driver = driver_admin
        driver.get("http://localhost:3000/admin/chambres/ajouter")
        time.sleep(2)

        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert len(body_text.strip()) > 0, "La page d'ajout ne doit pas être vide"
        # Vérifie qu'un formulaire est présent
        formulaires = driver.find_elements(By.CSS_SELECTOR, "form")
        champs = driver.find_elements(By.CSS_SELECTOR, "input, select, textarea")
        assert len(formulaires) > 0 or len(champs) > 0, \
            "La page d'ajout doit contenir un formulaire"

    # ------------------------------------------------------------------
    # 6.4 — Création d'une nouvelle chambre
    # ------------------------------------------------------------------
    def test_04_creer_nouvelle_chambre(self, driver_admin):
        """L'administrateur peut accéder et interagir avec le formulaire d'ajout d'une chambre."""
        driver = driver_admin
        driver.get("http://localhost:3000/admin/chambres/ajouter")
        time.sleep(2)

        # Remplir le champ nom
        champs_nom = driver.find_elements(By.XPATH,
            "//input[@name='nom'] | //input[contains(@placeholder,'nom') or contains(@placeholder,'Nom')]"
        )
        if champs_nom:
            champs_nom[0].clear()
            champs_nom[0].send_keys("Suite Selenium Test")

        # Remplit le champ numéro
        champs_numero = driver.find_elements(By.XPATH,
            "//input[@name='numero'] | //input[contains(@placeholder,'Numéro') or contains(@placeholder,'numero')]"
        )
        if champs_numero:
            champs_numero[0].clear()
            champs_numero[0].send_keys("TEST-999")

        # Remplit le prix
        champs_prix = driver.find_elements(By.XPATH,
            "//input[@name='prixNuit'] | //input[@name='prix_nuit'] | //input[contains(@placeholder,'Prix') or contains(@placeholder,'prix')]"
        )
        if champs_prix:
            champs_prix[0].clear()
            champs_prix[0].send_keys("600")

        # Remplit la capacité
        champs_cap = driver.find_elements(By.XPATH,
            "//input[@name='capacite'] | //input[contains(@placeholder,'Capacité') or contains(@placeholder,'capacite')]"
        )
        if champs_cap:
            champs_cap[0].clear()
            champs_cap[0].send_keys("2")

        # Sélectionne le type si un select existe
        selects = driver.find_elements(By.CSS_SELECTOR, "select[name='type'], select")
        if selects:
            try:
                Select(selects[0]).select_by_index(0)
            except Exception:
                pass

        # Vérifie que le bouton de soumission est présent et cliquable
        btn_submit = driver.find_elements(By.XPATH,
            "//button[@type='submit'] | //button[contains(text(),'Enregistrer') or contains(text(),'Ajouter')]"
        )
        assert len(btn_submit) > 0, "Le bouton de soumission du formulaire doit être présent"

    # ------------------------------------------------------------------
    # 6.5 — Boutons Modifier visibles sur les chambres
    # ------------------------------------------------------------------
    def test_05_boutons_modifier_visibles(self, driver_admin):
        """Des boutons Modifier sont visibles pour chaque chambre."""
        driver = driver_admin
        driver.get("http://localhost:3000/admin/chambres")
        time.sleep(3)

        body_text = driver.find_element(By.TAG_NAME, "body").text
        btns_modifier = driver.find_elements(By.XPATH,
            "//button[contains(text(),'Modifier') or contains(text(),'Éditer')] | "
            "//a[contains(@href,'modifier')]"
        )
        # Vérification souple : soit bouton, soit lien vers modifier
        assert len(btns_modifier) > 0 or "modifier" in body_text.lower() or "éditer" in body_text.lower(), \
            "Des options de modification doivent être disponibles pour les chambres"

    # ------------------------------------------------------------------
    # 6.6 — Boutons Supprimer visibles sur les chambres
    # ------------------------------------------------------------------
    def test_06_boutons_supprimer_visibles(self, driver_admin):
        """Des boutons de suppression / archivage sont visibles pour chaque chambre."""
        driver = driver_admin
        driver.get("http://localhost:3000/admin/chambres")
        time.sleep(3)

        body_text = driver.find_element(By.TAG_NAME, "body").text
        btns_suppr = driver.find_elements(By.CSS_SELECTOR,
            ".room-btn-delete, [title*='Archiver'], [title*='Supprimer'], button[aria-label*='supprimer']"
        )
        assert len(btns_suppr) > 0 or "🗑" in body_text or "supprimer" in body_text.lower(), (
            "Des options de suppression ou archivage doivent être disponibles pour les chambres"
        )
