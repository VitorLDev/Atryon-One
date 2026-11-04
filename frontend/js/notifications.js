import { NOTIFICATION_DATE_FORMATTER, priorityClassName } from "./utils.js";

export function createNotifications({ document, state, getTickets, canSupportAccess, openTicketDetails }) {
  const notificationWrap = document.getElementById("notification-wrap");
  const notificationButton = document.getElementById("notification-button");
  const notificationPanel = document.getElementById("notification-panel");
  const notificationList = document.getElementById("notification-list");
  const notificationSummary = document.getElementById("notification-summary");
  const notificationBadge = document.getElementById("notification-badge");

  function close() {
    notificationPanel.hidden = true;
    notificationButton.setAttribute("aria-expanded", "false");
  }

  function render() {
    const hasNotificationAccess = state.isAdmin || state.isSupport;
    notificationWrap.hidden = !hasNotificationAccess;
    if (!hasNotificationAccess) {
      close();
      return;
    }

    const pendingTickets = getTickets()
      .filter((ticket) => ticket.status !== "Resolvido" && canSupportAccess(ticket))
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    const count = pendingTickets.length;
    notificationBadge.hidden = count === 0;
    notificationBadge.textContent = count > 99 ? "99+" : String(count);
    notificationButton.setAttribute(
      "aria-label",
      count === 1 ? "1 chamado aguardando atendimento" : `${count} chamados aguardando atendimento`
    );
    notificationSummary.textContent = count === 0
      ? "Nenhum chamado aguardando atendimento."
      : count === 1
        ? "1 chamado precisa de atendimento."
        : `${count} chamados precisam de atendimento.`;

    notificationList.replaceChildren();
    if (count === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "notification-empty";
      emptyMessage.textContent = "Tudo em dia. Novos chamados aparecerão aqui.";
      notificationList.append(emptyMessage);
      return;
    }

    for (const ticket of pendingTickets) {
      const item = document.createElement("button");
      const title = document.createElement("span");
      const meta = document.createElement("span");
      const priorityDot = document.createElement("span");
      const ticketId = document.createElement("span");
      const ticketDate = document.createElement("time");

      item.className = "notification-item";
      item.type = "button";
      item.setAttribute(
        "aria-label",
        `${ticket.subject}, chamado ${ticket.id}, prioridade ${ticket.priority}, aberto em ${NOTIFICATION_DATE_FORMATTER.format(new Date(ticket.createdAt))}`
      );
      title.className = "notification-item-title";
      title.textContent = ticket.subject;
      meta.className = "notification-item-meta";
      priorityDot.className = `notification-priority-dot ${priorityClassName(ticket.priority)}`;
      priorityDot.setAttribute("aria-hidden", "true");
      ticketId.className = "notification-item-id";
      ticketId.textContent = ticket.id;
      ticketDate.className = "notification-item-date";
      ticketDate.dateTime = ticket.createdAt;
      ticketDate.textContent = NOTIFICATION_DATE_FORMATTER.format(new Date(ticket.createdAt));
      meta.append(priorityDot, ticketId);
      item.append(title, meta, ticketDate);
      item.addEventListener("click", () => {
        close();
        openTicketDetails(ticket.id);
      });
      notificationList.append(item);
    }
  }

  notificationButton.addEventListener("click", () => {
    const isExpanded = notificationButton.getAttribute("aria-expanded") === "true";
    notificationPanel.hidden = isExpanded;
    notificationButton.setAttribute("aria-expanded", String(!isExpanded));
  });

  document.addEventListener("click", (event) => {
    if (!notificationWrap.contains(event.target)) close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !notificationPanel.hidden) {
      close();
      notificationButton.focus();
    }
  });

  return { close, render };
}
