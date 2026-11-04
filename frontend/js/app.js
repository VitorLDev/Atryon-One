import { createAuth } from "./auth.js";
import { createNotifications } from "./notifications.js";
import { createTickets } from "./tickets.js";
import { showToast } from "./utils.js";

const state = {
  currentUser: "",
  isAdmin: false,
  isSupport: false
};
const today = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "numeric",
  month: "short"
});
document.getElementById("today").textContent = today.format(new Date());

let tickets;
const notifications = createNotifications({
  document,
  state,
  getTickets: () => tickets.getTickets(),
  canSupportAccess: (ticket) => tickets.canSupportAccess(ticket),
  openTicketDetails: (ticketId) => tickets.openTicketDetails(ticketId)
});

tickets = createTickets({
  document,
  state,
  showToast: (message) => showToast(document, message),
  closeNotifications: notifications.close,
  onChange: notifications.render
});

function enterApp(username) {
  state.currentUser = username;
  state.isAdmin = username.toLocaleLowerCase("pt-BR") === "admin";
  state.isSupport = username.toLocaleLowerCase("pt-BR") === "sup1";

  const displayName = username;
  document.getElementById("profile-name").textContent = displayName;
  document.getElementById("profile-avatar").textContent = displayName.slice(0, 2).toLocaleUpperCase("pt-BR");
  document.getElementById("profile-role").textContent = state.isAdmin
    ? "Administrador"
    : state.isSupport
      ? "Suporte"
      : "Solicitante";
  document.getElementById("admin-badge").hidden = !state.isAdmin;
  document.getElementById("support-badge").hidden = !state.isSupport;
  document.getElementById("page-title").textContent = state.isAdmin
    ? "Central de chamados"
    : state.isSupport
      ? "Fila de suporte"
      : "Meus chamados";
  document.getElementById("page-description").textContent = state.isAdmin
    ? "Gerencie as solicitações de todos os usuários do Atryon One."
    : state.isSupport
      ? "Acompanhe e atenda os chamados abertos pelos usuários."
      : "Acompanhe suas solicitações ou conte para a gente como podemos ajudar.";
  document.getElementById("tickets-description").textContent = state.isAdmin
    ? "Edite solicitações, atualize status e gerencie chamados de todos os usuários."
    : state.isSupport
      ? "Selecione um chamado para consultar os detalhes e atualizar o atendimento."
      : "Consulte as solicitações registradas por você.";
  document.getElementById("open-modal").hidden = state.isSupport;
  document.getElementById("tickets-heading").textContent = state.isSupport ? "Chamados para atender" : "Todos os chamados";
  tickets.showTicketList();
  tickets.load();
}

function leaveApp() {
  state.currentUser = "";
  state.isAdmin = false;
  state.isSupport = false;
  notifications.render();
}

const auth = createAuth({
  document,
  onLogin: enterApp,
  onLogout: leaveApp,
  showToast: (message) => showToast(document, message)
});

auth.restoreSession();
