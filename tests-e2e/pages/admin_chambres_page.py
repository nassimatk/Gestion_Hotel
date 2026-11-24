"""
pages/admin_chambres_page.py — Page Object pour /admin/chambres
"""

import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from pages.base_page import BasePage


class AdminChambresPage(BasePage):

    BTN_AJOUTER   = (By.XPATH, "//a[contains(@href,'ajouter')] | //button[contains(text(),'Ajouter')]")
    LIGNES_TABLEAU = (By.CSS_SELECTOR, ".chambre-card, .admin-chambre-card, [class*='chambre-item']")
    BTN_SUPPRIMER  = (By.XPATH, "//button[contains(text(),'Supprimer') or contains(text(),'supprimer')]")
    BTN_MODIFIER   = (By.XPATH, "//button[contains(text(),'Modifier') or contains(text(),'Éditer') or contains(text(),'modifier')]")
    CONFIRMATION_DIALOG = (By.XPATH, "//div[contains(@class,'confirm') or contains(@class,'modal')]")

    def ouvrir(self):
        self.aller_a("/admin/chambres")
        time.sleep(2)

    def est_sur_page_chambres_admin(self):
        return "/admin/chambres" in self.url_actuelle()

    def nombre_chambres(self):
        time.sleep(1)
        cartes = self.driver.find_elements(*self.LIGNES_TABLEAU)
        return len(cartes)

    def cliquer_ajouter(self):
        self.attendre_cliquable(*self.BTN_AJOUTER).click()
        time.sleep(1)

    def est_sur_formulaire_ajout(self):
        return "ajouter" in self.url_actuelle() or \
               bool(self.driver.find_elements(By.XPATH, "//form | //*[contains(@class,'form') and contains(@class,'chambre')]"))

    def remplir_formulaire_chambre(self, numero, type_chambre="simple", prix=500, capacite=1):
        """Remplit le formulaire d'ajout d'une chambre."""
        time.sleep(1)
        champs = {
            "numero": numero,
        }
        try:
            el = self.driver.find_element(By.XPATH, "//input[@name='numero'] | //input[contains(@placeholder,'numero') or contains(@placeholder,'Numéro')]")
            el.clear(); el.send_keys(numero)
        except Exception:
            pass
        try:
            el = self.driver.find_element(By.XPATH, "//input[@name='prix_nuit'] | //input[contains(@placeholder,'prix') or contains(@placeholder,'Prix')]")
            el.clear(); el.send_keys(str(prix))
        except Exception:
            pass
        try:
            el = self.driver.find_element(By.XPATH, "//input[@name='capacite'] | //input[contains(@placeholder,'capacite') or contains(@placeholder,'Capacité')]")
            el.clear(); el.send_keys(str(capacite))
        except Exception:
            pass
        try:
            el = self.driver.find_element(By.XPATH, "//select[@name='type'] | //select[contains(@class,'type')]")
            from selenium.webdriver.support.ui import Select
            Select(el).select_by_visible_text(type_chambre)
        except Exception:
            pass

    def soumettre_formulaire(self):
        btn = self.driver.find_element(By.XPATH, "//button[@type='submit'] | //button[contains(text(),'Enregistrer') or contains(text(),'Sauvegarder') or contains(text(),'Ajouter')]")
        btn.click()
        time.sleep(2)

    def supprimer_chambre(self, index=0):
        """Clique sur le bouton Supprimer d'une chambre."""
        btns = self.driver.find_elements(*self.BTN_SUPPRIMER)
        if btns and index < len(btns):
            btns[index].click()
            time.sleep(1)
            # Accepte l'alerte window.confirm si elle existe
            try:
                alert = self.driver.switch_to.alert
                alert.accept()
                time.sleep(1)
            except Exception:
                pass
