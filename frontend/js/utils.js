export const LEGACY_USERNAME_ALIASES = new Map([
  ["admin@atryonone.com.br", "Admin"],
  ["teste@teste.com.br", "Teste"]
]);

export const TICKET_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

export const NOTIFICATION_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit"
});

export function normalizeUsername(username) {
  const trimmedUsername = username.trim();
  const normalizedUsername = trimmedUsername.toLocaleLowerCase("pt-BR");
  if (normalizedUsername === "admin") return "Admin";
  if (normalizedUsername === "teste") return "Teste";
  return LEGACY_USERNAME_ALIASES.get(normalizedUsername) || trimmedUsername;
}

export function priorityClassName(priority) {
  return `priority-${priority.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
}

export function showToast(document, message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("visible"), 3200);
}
