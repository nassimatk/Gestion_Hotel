"""
pages/admin_dashboard_page.py — Page Object pour /admin (dashboard)
"""

import time
from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class AdminDashboardPage(BasePage):

    TITRE      = (By.XPATH, "//*[contains(text(),'Tableau de bord') or contains(text(),'tableau de bord')]")
    KPI_CLIENTS = (By.XPATH, "//*[contains(text(),'Clients') or contains(text(),'CLIENTS')]/ancestor::*[contains(@class,'kpi') or contains(@class,'card')][1]")
    KPI_CHAMBRES = (By.XPATH, "//*[contains(text(),'Chambres') or contains(text(),'CHAMBRES')]/ancestor::*[contains(@class,'kpi') or contains(@class,'card')][1]")
    NAV_CLIENTS  = (By.LINK_TEXT, "Clients")
    NAV_CHAMBRES = (By.LINK_TEXT, "Gestion des chambres")
    NAV_AVIS     = (By.LINK_TEXT, "Avis")
    NAV_RESERVATIONS = (By.LINK_TEXT, "Réservations")

    def ouvrir(self):
        self.aller_a("/admin")
        time.sleep(2)

    def est_sur_dashboard(self):
        return "/admin" in self.url_actuelle()

    def valeur_kpi_clients(self):
        """Retourne la valeur numérique affichée dans le KPI Clients."""
        try:
            # Cherche la valeur affichée (un grand nombre dans la section Clients)
            el = self.driver.find_element(By.XPATH,
                "//*[contains(text(),'CLIENTS') or contains(text(),'Clients')]"
                "/following-sibling::*[1] | "
                "//*[contains(@class,'dash-kpi') and .//*[contains(text(),'Clients')]]//*[contains(@class,'value') or contains(@class,'nombre') or @class='dash-kpi-value']"
            )
            return el.text.strip()
        except Exception:
            return None

    def aller_vers_clients(self):
        self.attendre_cliquable(*self.NAV_CLIENTS).click()
        self.attendre_url_contient("/admin/clients")

    def aller_vers_chambres(self):
        self.attendre_cliquable(*self.NAV_CHAMBRES).click()
        self.attendre_url_contient("/admin/chambres")

    def aller_vers_avis(self):
        self.attendre_cliquable(*self.NAV_AVIS).click()
        self.attendre_url_contient("/admin/avis")

    def aller_vers_reservations(self):
        self.attendre_cliquable(*self.NAV_RESERVATIONS).click()

    def section_reservations_du_jour_visible(self):
        try:
            el = self.driver.find_element(By.XPATH,
                "//*[contains(text(),'Réservations du jour') or contains(text(),'reservations du jour')]")
            return el.is_displayed()
        except Exception:
            return False
