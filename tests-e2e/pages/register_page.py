"""
pages/register_page.py — Page Object pour /register
"""

import time
from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class RegisterPage(BasePage):

    INPUT_NAME             = (By.CSS_SELECTOR, "input[type='text'].auth-input")
    INPUT_EMAIL            = (By.CSS_SELECTOR, "input[type='email'].auth-input")
    INPUT_PASSWORD         = (By.XPATH, "(//input[contains(@class,'auth-input') and @type='password'])[1]")
    INPUT_CONFIRM_PASSWORD = (By.XPATH, "(//input[contains(@class,'auth-input') and @type='password'])[2]")
    CHECKBOX_TERMS         = (By.CSS_SELECTOR, "input[type='checkbox']")
    BTN_SUBMIT             = (By.CSS_SELECTOR, "form button[type='submit']")
    DIV_ERROR              = (By.CSS_SELECTOR, ".auth-error")

    def ouvrir(self):
        self.aller_a("/register")
        self.attendre_element(By.CSS_SELECTOR, ".auth-title")

    def s_inscrire(self, nom, email, password, confirm_password=None):
        if confirm_password is None:
            confirm_password = password

        self.attendre_cliquable(*self.INPUT_NAME).send_keys(nom)
        self.attendre_cliquable(*self.INPUT_EMAIL).send_keys(email)
        self.attendre_cliquable(*self.INPUT_PASSWORD).send_keys(password)
        self.attendre_cliquable(*self.INPUT_CONFIRM_PASSWORD).send_keys(confirm_password)

        try:
            checkbox = self.driver.find_element(*self.CHECKBOX_TERMS)
            if not checkbox.is_selected():
                self.driver.execute_script("arguments[0].click();", checkbox)
        except Exception:
            pass

        btn = self.attendre_cliquable(*self.BTN_SUBMIT)
        self.driver.execute_script("arguments[0].click();", btn)
        time.sleep(3)

    def message_erreur(self):
        try:
            el = self.attendre_element(*self.DIV_ERROR)
            return el.text.strip()
        except Exception:
            return ""

    def est_inscrit(self):
        return "/register" not in self.url_actuelle()
