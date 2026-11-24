"""
pages/admin_clients_page.py — Page Object pour /admin/clients
"""

import time
from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class AdminClientsPage(BasePage):

    TITRE_PAGE        = (By.XPATH, "//*[contains(text(),'utilisateurs') or contains(text(),'Clients') or contains(text(),'clients')]")
    LIGNES_UTILISATEUR = (By.CSS_SELECTOR, "table tbody tr, [class*='client-row'], [class*='user-row']")
    BTN_DESACTIVER    = (By.XPATH, "//button[contains(text(),'Désactiver') or contains(text(),'desactiver')]")
    BADGE_ADMIN       = (By.XPATH, "//*[contains(text(),'Administrateur') or contains(@class,'admin') and contains(text(),'admin')]")
    CHAMP_RECHERCHE   = (By.CSS_SELECTOR, "input[type='search'], input[type='text'][placeholder*='Rechercher'], input[placeholder*='nom']")
    TOTAL_TEXTE       = (By.XPATH, "//*[contains(text(),'résultat') or contains(text(),'Affichage')]")

    def ouvrir(self):
        self.aller_a("/admin/clients")
        time.sleep(2)

    def est_sur_page_clients_admin(self):
        return "/admin/clients" in self.url_actuelle()

    def nombre_utilisateurs(self):
        lignes = self.driver.find_elements(*self.LIGNES_UTILISATEUR)
        return len(lignes)

    def admin_a_pas_de_bouton_desactiver(self):
        """Vérifie que la ligne Admin n'a pas de bouton Désactiver."""
        try:
            ligne_admin = self.driver.find_element(By.XPATH,
                "//td[contains(text(),'Administrateur')]/parent::tr | "
                "//td[contains(text(),'admin@hotelhub')]/parent::tr"
            )
            btns = ligne_admin.find_elements(By.XPATH, ".//button[contains(text(),'Désactiver')]")
            return len(btns) == 0
        except Exception:
            return True  # Pas de ligne admin visible

    def desactiver_premier_client(self):
        """Clique sur le premier bouton Désactiver et confirme."""
        btns = self.driver.find_elements(*self.BTN_DESACTIVER)
        if btns:
            btns[0].click()
            time.sleep(1)
            # Confirme la boîte de dialogue window.confirm si elle apparaît
            try:
                alert = self.driver.switch_to.alert
                alert.accept()
                time.sleep(1)
            except Exception:
                # Cherche un bouton de confirmation dans une modal
                try:
                    btn_confirmer = self.driver.find_element(By.XPATH,
                        "//button[contains(text(),'Confirmer') or contains(text(),'Oui') or contains(text(),'Supprimer')]")
                    btn_confirmer.click()
                    time.sleep(1)
                except Exception:
                    pass

    def texte_total_affiche(self):
        try:
            el = self.driver.find_element(*self.TOTAL_TEXTE)
            return el.text.strip()
        except Exception:
            return ""
