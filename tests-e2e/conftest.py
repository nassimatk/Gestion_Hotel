"""
conftest.py — Configuration globale des tests E2E HotelHub
Selenium + pytest
"""

import pytest
import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# ============================================================
# URLs de l'application (via Docker, ports exposés sur localhost)
# ============================================================

BASE_URL   = "http://localhost:3000"

AUTH_API        = "http://localhost:8005/api"
CHAMBRES_API    = "http://localhost:8001/api"
DISPONIBILITES_API = "http://localhost:8003/api"
AVIS_API        = "http://localhost:8002/api"
TARIFS_API      = "http://localhost:8004/api"

# ============================================================
# Comptes de test (existants en base de données)
# ============================================================

ADMIN_EMAIL    = "admin@hotelhub.com"
ADMIN_PASSWORD = "admin_secret"

CLIENT_EMAIL    = "nassima@example.com"
CLIENT_PASSWORD = "password123"

# Données créées pendant les tests (nettoyées après)
TEST_CHAMBRE_NUMERO = "999"
TEST_CHAMBRE_TYPE   = "simple"
TEST_REGISTER_EMAIL = "selenium_test@hotelhub.com"
TEST_REGISTER_NAME  = "Selenium Test"
TEST_REGISTER_PASS  = "TestPass123!"

# ============================================================
# Fixture : WebDriver (Chrome)
# ============================================================

@pytest.fixture(scope="function")
def driver():
    """
    Lance un navigateur Chrome pour chaque test.
    Utilise webdriver-manager pour télécharger automatiquement
    le bon ChromeDriver selon la version de Chrome installée.
    """
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1366,768")
    options.add_argument("--disable-notifications")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])

    service = Service(ChromeDriverManager().install())
    driver  = webdriver.Chrome(service=service, options=options)
    driver.implicitly_wait(10)
    driver.maximize_window()

    yield driver

    driver.quit()


@pytest.fixture(scope="function")
def driver_admin(driver):
    """
    Retourne un driver déjà connecté en tant qu'administrateur.
    """
    from pages.login_page import LoginPage
    login = LoginPage(driver)
    login.ouvrir()
    login.se_connecter(ADMIN_EMAIL, ADMIN_PASSWORD)
    time.sleep(2)
    return driver


@pytest.fixture(scope="function")
def driver_client(driver):
    """
    Retourne un driver déjà connecté en tant que client.
    """
    from pages.login_page import LoginPage
    login = LoginPage(driver)
    login.ouvrir()
    login.se_connecter(CLIENT_EMAIL, CLIENT_PASSWORD)
    time.sleep(2)
    return driver


# ============================================================
# Hook : capture d'écran automatique sur échec
# ============================================================

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep     = outcome.get_result()

    if rep.when == "call" and rep.failed:
        driver = item.funcargs.get("driver") or \
                 item.funcargs.get("driver_admin") or \
                 item.funcargs.get("driver_client")
        if driver:
            os.makedirs("reports/screenshots", exist_ok=True)
            test_name = item.name.replace("/", "_").replace(" ", "_")
            path      = f"reports/screenshots/{test_name}.png"
            driver.save_screenshot(path)
            # Intègre la capture dans le rapport HTML
            if hasattr(rep, "extra"):
                from pytest_html import extras
                rep.extra = rep.extra or []
                rep.extra.append(extras.image(path))
