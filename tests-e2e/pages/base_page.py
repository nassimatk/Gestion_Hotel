"""
pages/base_page.py — Classe de base commune à tous les Page Objects
"""

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

BASE_URL = "http://localhost:3000"


class BasePage:
    def __init__(self, driver):
        self.driver  = driver
        self.wait    = WebDriverWait(driver, 15)
        self.base_url = BASE_URL

    def aller_a(self, chemin=""):
        self.driver.get(f"{self.base_url}{chemin}")

    def attendre_element(self, by, valeur):
        return self.wait.until(EC.presence_of_element_located((by, valeur)))

    def attendre_cliquable(self, by, valeur):
        return self.wait.until(EC.element_to_be_clickable((by, valeur)))

    def attendre_texte_dans_element(self, by, valeur, texte):
        return self.wait.until(EC.text_to_be_present_in_element((by, valeur), texte))

    def attendre_url_contient(self, texte):
        return self.wait.until(EC.url_contains(texte))

    def titre_page(self):
        return self.driver.title

    def url_actuelle(self):
        return self.driver.current_url
