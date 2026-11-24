"""
pages/admin_avis_page.py — Page Object pour /admin/avis
"""

import time
from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class AdminAvisPage(BasePage):

    TITRE_PAGE  = (By.XPATH, "//*[contains(text(),'Avis') or contains(text(),'avis')]")
    LIGNES_AVIS = (By.CSS_SELECTOR, "[class*='avis-card'], [class*='avis-item'], table tbody tr")
    BTN_SUPPRIMER = (By.XPATH, "//button[contains(text(),'Supprimer') or contains(text(),'Effacer')]")
    NOTE_MOYENNE  = (By.XPATH, "//*[contains(text(),'moyenne') or contains(text(),'Moyenne') or contains(text(),'/5')]")

    def ouvrir(self):
        self.aller_a("/admin/avis")
        time.sleep(2)

    def est_sur_page_avis_admin(self):
        return "/admin/avis" in self.url_actuelle()

    def note_moyenne_visible(self):
        try:
            el = self.driver.find_element(*self.NOTE_MOYENNE)
            return el.is_displayed()
        except Exception:
            return False

    def nombre_avis(self):
        lignes = self.driver.find_elements(*self.LIGNES_AVIS)
        return len(lignes)

    def supprimer_premier_avis(self):
        btns = self.driver.find_elements(*self.BTN_SUPPRIMER)
        if btns:
            btns[0].click()
            time.sleep(1)
            try:
                alert = self.driver.switch_to.alert
                alert.accept()
                time.sleep(1)
            except Exception:
                try:
                    btn = self.driver.find_element(By.XPATH,
                        "//button[contains(text(),'Confirmer') or contains(text(),'Oui')]")
                    btn.click()
                    time.sleep(1)
                except Exception:
                    pass
