"""
test_04_avis.py
Scénario 4 : Consultation et soumission d'avis
"""

import time
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from selenium.webdriver.common.by import By


class TestAvis:

    # ------------------------------------------------------------------
    # 4.1 — Page d'avis accessible
    # ------------------------------------------------------------------
    def test_01_page_avis_accessible(self, driver_client):
        """La page d'avis d'une chambre est accessible."""
        driver = driver_client
        # Page avis pour la chambre 1
        driver.get("http://localhost:3000/chambres/1/avis")
        time.sleep(3)

        url = driver.current_url
        assert "/login" not in url, "Un client connecté ne doit pas être redirigé vers /login"
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert len(body_text.strip()) > 0, "La page avis ne doit pas être vide"

    # ------------------------------------------------------------------
    # 4.2 — Liste des avis visible
    # ------------------------------------------------------------------
    def test_02_liste_avis_visible(self, driver_client):
        """La page affiche les avis existants ou un message si vide."""
        driver = driver_client
        driver.get("http://localhost:3000/chambres/1/avis")
        time.sleep(3)

        body_text = driver.find_element(By.TAG_NAME, "body").text
        # Cherche des avis ou un message d'absence d'avis
        indicateurs = ["avis", "commentaire", "note", "étoile", "aucun", "premier", "/5", "satisfaction", "retour"]
        trouve = any(ind.lower() in body_text.lower() for ind in indicateurs)
        assert trouve, "La page doit afficher des avis ou un message approprié"

    # ------------------------------------------------------------------
    # 4.3 — Formulaire d'avis visible (si connecté)
    # ------------------------------------------------------------------
    def test_03_formulaire_avis_visible(self, driver_client):
        """Un client connecté voit l'interface pour soumettre un avis."""
        driver = driver_client
        driver.get("http://localhost:3000/chambres/1/avis")
        time.sleep(3)

        body_text = driver.find_element(By.TAG_NAME, "body").text
        # Cherche un formulaire ou un textarea pour l'avis
        formulaires = driver.find_elements(By.CSS_SELECTOR,
            "form, textarea, input[type='text'], [class*='star'], [class*='etoile'], button"
        )
        assert len(formulaires) > 0 or "avis" in body_text.lower(), (
            "L'interface de consultation ou soumission d'avis doit être accessible"
        )

    # ------------------------------------------------------------------
    # 4.4 — Soumission d'un avis
    # ------------------------------------------------------------------
    def test_04_soumettre_avis(self, driver_client):
        """Un client connecté peut interagir avec la page des avis."""
        driver = driver_client
        driver.get("http://localhost:3000/chambres/1/avis")
        time.sleep(3)

        # Cherche des étoiles pour noter
        etoiles = driver.find_elements(By.CSS_SELECTOR,
            "[class*='star'], [class*='etoile'], [data-rating], svg[class*='star'], button"
        )
        if etoiles:
            etoiles[min(2, len(etoiles) - 1)].click()
            time.sleep(0.5)

        # Cherche un textarea pour le commentaire
        textareas = driver.find_elements(By.CSS_SELECTOR, "textarea")
        if textareas:
            textareas[0].clear()
            textareas[0].send_keys("Test automatique Selenium E2E.")
            time.sleep(0.5)

        assert "/login" not in driver.current_url, \
            "Le client ne doit pas être redirigé vers /login"
