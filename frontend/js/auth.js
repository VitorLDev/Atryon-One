import { normalizeUsername } from "./utils.js";

const SESSION_KEY = "atryon-one-user";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Adm123";
const TEST_USERNAME = "teste";
const TEST_PASSWORD = "teste";
const SUPPORT_USERNAME = "sup1";
const SUPPORT_PASSWORD = "123456";

function getLoginError(username, password) {
  const normalizedUsername = username.toLocaleLowerCase("pt-BR");

  if (normalizedUsername === ADMIN_USERNAME && password !== ADMIN_PASSWORD) {
    return "A senha do administrador está incorreta.";
  }
  if (normalizedUsername === TEST_USERNAME && password !== TEST_PASSWORD) {
    return "A senha do usuário de teste está incorreta.";
  }
  if (normalizedUsername === SUPPORT_USERNAME && password !== SUPPORT_PASSWORD) {
    return "A senha do usuário de suporte está incorreta.";
  }
  if (
    normalizedUsername !== ADMIN_USERNAME &&
    normalizedUsername !== TEST_USERNAME &&
    normalizedUsername !== SUPPORT_USERNAME &&
    password.length < 6
  ) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }
  return "";
}

export function createAuth({ document, onLogin, onLogout, showToast }) {
  const loginScreen = document.getElementById("login-screen");
  const appShell = document.getElementById("app-shell");
  const loginForm = document.getElementById("login-form");
  const loginUsername = document.getElementById("login-username");
  const loginError = document.getElementById("login-error");

  function activate(username) {
    const canonicalUsername = normalizeUsername(username);
    onLogin(canonicalUsername);
    loginScreen.hidden = true;
    appShell.hidden = false;
  }

  function showLogin() {
    appShell.hidden = true;
    loginScreen.hidden = false;
    loginForm.reset();
    loginError.hidden = true;
    loginUsername.focus();
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;

    const formData = new FormData(loginForm);
    const username = normalizeUsername(formData.get("username"));
    const password = formData.get("password");
    const error = getLoginError(username, password);
    if (error) {
      loginError.textContent = error;
      loginError.hidden = false;
      return;
    }

    try {
      sessionStorage.setItem(SESSION_KEY, username);
    } catch (storageError) {
      console.error("Não foi possível iniciar a sessão.", storageError);
      showToast("Não foi possível iniciar a sessão neste navegador.");
      return;
    }

    loginError.hidden = true;
    activate(username);
  });

  document.getElementById("logout-button").addEventListener("click", () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (storageError) {
      console.error("Não foi possível encerrar a sessão.", storageError);
      showToast("Não foi possível encerrar a sessão neste navegador.");
      return;
    }

    onLogout();
    showLogin();
  });

  function restoreSession() {
    try {
      const savedUsername = sessionStorage.getItem(SESSION_KEY);
      if (savedUsername && savedUsername.trim()) {
        activate(savedUsername);
      } else {
        showLogin();
      }
    } catch (storageError) {
      console.error("Não foi possível restaurar a sessão.", storageError);
      showLogin();
    }
  }

  return { restoreSession };
}
