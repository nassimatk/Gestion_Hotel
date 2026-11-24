"""
pages/home_page.py — Page Object pour / (page d'accueil)
"""

from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class HomePage(BasePage):

    NAV_LINK_CHAMBRES = (By.LINK_TEXT, "Chambres")
    NAV_LINK_TARIFS   = (By.LINK_TEXT, "Tarifs")
    NAV_LINK_LOGIN    = (By.LINK_TEXT, "Connexion")
    BTN_DECONNEXION   = (By.XPATH, "//*[contains(text(),'Déconnexion') or contains(text(),'deconnexion')]")

    def ouvrir(self):
        self.aller_a("/")

    def est_sur_accueil(self):
        url = self.url_actuelle()
        return url.endswith("/") or url.endswith("3000") or url == "http://localhost:3000/"

    def aller_chambres(self):
        self.attendre_cliquable(*self.NAV_LINK_CHAMBRES).click()
        self.attendre_url_contient("/chambres")

    def aller_tarifs(self):
        self.attendre_cliquable(*self.NAV_LINK_TARIFS).click()
        self.attendre_url_contient("/tarifs")

    def se_deconnecter(self):
        try:
            btn = self.attendre_cliquable(*self.BTN_DECONNEXION)
            btn.click()
        except Exception:
            # Cherche dans le menu navbar
            btns = self.driver.find_elements(By.XPATH,
                "//*[contains(translate(text(),'DÉCONNEXION','déconnexion'),'déconnexion')]")
            if btns:
                btns[0].click()
