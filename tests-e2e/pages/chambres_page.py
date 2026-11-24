"""
pages/chambres_page.py — Page Object pour /chambres
"""

import time
from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class ChambresPage(BasePage):

    TITRE_PAGE    = (By.XPATH, "//*[contains(text(),'Chambre') or contains(text(),'chambre')]")
    CARTE_CHAMBRE = (By.CSS_SELECTOR, ".chambre-card, .room-card, [class*='chambre'][class*='card']")
    BTN_RESERVER  = (By.XPATH, "//button[contains(text(),'Réserver') or contains(text(),'reserver')]|//a[contains(text(),'Réserver')]")
    BTN_DETAIL    = (By.XPATH, "//button[contains(text(),'Détail') or contains(text(),'Voir')]|//a[contains(text(),'Voir')]")

    def ouvrir(self):
        self.aller_a("/chambres")

    def est_sur_page_chambres(self):
        return "/chambres" in self.url_actuelle()

    def nombre_chambres_affiches(self):
        try:
            cartes = self.driver.find_elements(*self.CARTE_CHAMBRE)
            return len(cartes)
        except Exception:
            return 0

    def cliquer_premiere_chambre(self):
        """Clique sur le premier lien/bouton de détail d'une chambre."""
        time.sleep(1)
        # Cherche un lien vers /chambres/{id}
        liens = self.driver.find_elements(By.XPATH, "//a[contains(@href,'/chambres/')]")
        if liens:
            liens[0].click()
            time.sleep(1)
        else:
            # Cherche un bouton de détail
            btns = self.driver.find_elements(By.XPATH,
                "//button[contains(text(),'Détail') or contains(text(),'Voir') or contains(text(),'Réserver')]")
            if btns:
                btns[0].click()
                time.sleep(1)

    def est_sur_detail_chambre(self):
        return "/chambres/" in self.url_actuelle() or "/reservation" in self.url_actuelle()
