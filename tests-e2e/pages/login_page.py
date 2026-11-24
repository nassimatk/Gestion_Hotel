"""
pages/login_page.py — Page Object pour /login
"""

import time
from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class LoginPage(BasePage):

    # Sélecteurs CSS basés sur le code LoginPage.jsx
    INPUT_EMAIL     = (By.CSS_SELECTOR, "input[type='email'].auth-input")
    INPUT_PASSWORD  = (By.CSS_SELECTOR, "input[type='password'].auth-input, input[type='text'].auth-input")
    BTN_SUBMIT      = (By.CSS_SELECTOR, "form button[type='submit']")
    DIV_ERROR       = (By.CSS_SELECTOR, ".auth-error")
    LINK_REGISTER   = (By.LINK_TEXT, "Créer un compte")

    def ouvrir(self):
        self.aller_a("/login")
        self.attendre_element(By.CSS_SELECTOR, ".auth-title")

    def se_connecter(self, email, password):
        champ_email = self.attendre_cliquable(*self.INPUT_EMAIL)
        champ_email.clear()
        champ_email.send_keys(email)

        champ_mdp = self.attendre_cliquable(*self.INPUT_PASSWORD)
        champ_mdp.clear()
        champ_mdp.send_keys(password)

        btn = self.attendre_cliquable(*self.BTN_SUBMIT)
        self.driver.execute_script("arguments[0].click();", btn)
        time.sleep(3)

    def message_erreur(self):
        try:
            el = self.attendre_element(*self.DIV_ERROR)
            return el.text.strip()
        except Exception:
            return ""

    def est_sur_page_login(self):
        return "/login" in self.url_actuelle()

    def est_connecte(self):
        """Vérifie que la redirection a eu lieu (on n'est plus sur /login)"""
        return "/login" not in self.url_actuelle()
