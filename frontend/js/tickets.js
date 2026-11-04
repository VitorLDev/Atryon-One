import { LEGACY_USERNAME_ALIASES, TICKET_DATE_FORMATTER, priorityClassName } from "./utils.js";

const TICKET_STORAGE_KEY = "atryon-one-tickets-v2";
const LEGACY_STORAGE_KEY = "atryon-one-tickets";
const MIGRATION_KEY = "atryon-one-tickets-v2-migrated";
const PRIORITIES = ["Baixa", "Média", "Alta"];
const STATUSES = ["Em andamento", "Resolvido"];

function isValidTicket(ticket) {
  return Boolean(
    ticket &&
    typeof ticket.id === "string" &&
    typeof ticket.subject === "string" &&
    typeof ticket.description === "string" &&
    PRIORITIES.includes(ticket.priority) &&
    typeof ticket.createdAt === "string"
  );
}

export function createTickets({ document, state, showToast, onChange, closeNotifications }) {
  const tickets = [];
  let editingTicketId = "";
  let currentTicketId = "";
  const form = document.getElementById("ticket-form");
  const modal = document.getElementById("modal-backdrop");
  const ticketList = document.getElementById("ticket-list");
  const searchInput = document.getElementById("search");
  const priorityFilter = document.getElementById("priority-filter");
  const ticketStatus = document.getElementById("ticket-status");
  const ticketStatusField = document.getElementById("ticket-status-field");
  const dashboardView = document.getElementById("dashboard-view");
  const ticketDetailView = document.getElementById("ticket-detail-view");

  function migrateLegacyTickets() {
    if (localStorage.getItem(MIGRATION_KEY) === "true") return;

    const legacyKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key) => key && (key === LEGACY_STORAGE_KEY || key.startsWith(`${LEGACY_STORAGE_KEY}:`)))
      .sort((left, right) => Number(left === LEGACY_STORAGE_KEY) - Number(right === LEGACY_STORAGE_KEY));
    const migratedTickets = [];
    const migratedIds = new Set();

    for (const key of legacyKeys) {
      const legacyTickets = JSON.parse(localStorage.getItem(key));
      if (!Array.isArray(legacyTickets)) throw new Error(`Formato de chamados inválido em ${key}.`);

      const legacyOwner = key === LEGACY_STORAGE_KEY ? "Usuário" : key.slice(`${LEGACY_STORAGE_KEY}:`.length);
      const owner = LEGACY_USERNAME_ALIASES.get(legacyOwner.toLocaleLowerCase("pt-BR"))
        || legacyOwner.split("@")[0]
        || "Usuário";
      for (const ticket of legacyTickets) {
        if (!isValidTicket(ticket) || migratedIds.has(ticket.id)) continue;
        migratedIds.add(ticket.id);
        migratedTickets.push({
          ...ticket,
          createdBy: ticket.createdBy || owner,
          status: ticket.status === "Resolvido" ? "Resolvido" : "Em andamento",
          assignedTo: typeof ticket.assignedTo === "string" ? ticket.assignedTo : ""
        });
      }
    }

    localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(migratedTickets));
    localStorage.setItem(MIGRATION_KEY, "true");
  }

  function loadTickets() {
    try {
      migrateLegacyTickets();
      const storedTickets = localStorage.getItem(TICKET_STORAGE_KEY);
      if (!storedTickets) {
        tickets.splice(0, tickets.length);
        return true;
      }

      const parsedTickets = JSON.parse(storedTickets);
      if (!Array.isArray(parsedTickets)) throw new Error("Formato de chamados inválido.");
      const ticketsById = new Map();
      for (const ticket of parsedTickets) {
        if (!isValidTicket(ticket)) continue;
        const normalizedTicket = {
          ...ticket,
          createdBy: typeof ticket.createdBy === "string"
            ? (LEGACY_USERNAME_ALIASES.get(ticket.createdBy.toLocaleLowerCase("pt-BR")) || ticket.createdBy.split("@")[0])
            : "Usuário",
          status: ticket.status === "Resolvido" ? "Resolvido" : "Em andamento",
          assignedTo: typeof ticket.assignedTo === "string" ? ticket.assignedTo : ""
        };
        const previousTicket = ticketsById.get(ticket.id);
        if (!previousTicket || (previousTicket.createdBy === "Usuário" && normalizedTicket.createdBy !== "Usuário")) {
          ticketsById.set(ticket.id, normalizedTicket);
        }
      }

      tickets.splice(0, tickets.length, ...ticketsById.values());
      return true;
    } catch (error) {
      console.error("Não foi possível carregar os chamados salvos.", error);
      tickets.splice(0, tickets.length);
      showToast("Não foi possível carregar os chamados salvos.");
      return false;
    }
  }

  function saveTickets() {
    try {
      localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(tickets));
      return true;
    } catch (error) {
      console.error("Não foi possível salvar o chamado.", error);
      showToast("Não foi possível salvar. Verifique o espaço disponível no navegador.");
      return false;
    }
  }

  function getVisibleTickets() {
    if (state.isAdmin) return [...tickets];
    if (state.isSupport) return tickets.filter(canSupportAccess);
    return tickets.filter((ticket) => ticket.createdBy.toLocaleLowerCase("pt-BR") === state.currentUser.toLocaleLowerCase("pt-BR"));
  }

  function updateStats() {
    const visibleTickets = state.isAdmin || state.isSupport
      ? tickets
      : tickets.filter((ticket) => ticket.createdBy.toLocaleLowerCase("pt-BR") === state.currentUser.toLocaleLowerCase("pt-BR"));
    document.getElementById("total-count").textContent = String(visibleTickets.length);
    document.getElementById("open-count").textContent = String(visibleTickets.filter((ticket) => ticket.status !== "Resolvido").length);
    document.getElementById("high-count").textContent = String(visibleTickets.filter((ticket) => ticket.priority === "Alta").length);
  }

  function canManageTicket(ticket) {
    return state.isAdmin || (
      typeof ticket.createdBy === "string" &&
      ticket.createdBy.toLocaleLowerCase("pt-BR") === state.currentUser.toLocaleLowerCase("pt-BR")
    );
  }

  function canSupportAccess(ticket) {
    return state.isAdmin || !ticket.assignedTo || ticket.assignedTo === state.currentUser;
  }

  function updateTicketStatus(ticketId, status) {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket || !STATUSES.includes(status) || (!state.isAdmin && (!state.isSupport || ticket.assignedTo !== state.currentUser))) {
      return false;
    }

    const previousStatus = ticket.status;
    ticket.status = status;
    if (!saveTickets()) {
      ticket.status = previousStatus;
      render();
      return false;
    }
    render();
    return true;
  }

  function openTicketDetails(ticketId) {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket || (!state.isAdmin && (state.isSupport ? !canSupportAccess(ticket) : !canManageTicket(ticket)))) return;

    currentTicketId = ticket.id;
    dashboardView.hidden = true;
    ticketDetailView.hidden = false;
    document.getElementById("detail-ticket-id").textContent = ticket.id;
    document.getElementById("detail-title").textContent = "Detalhes do chamado";
    document.getElementById("detail-subtitle").textContent = "Confira as informações e atualize o atendimento.";
    document.getElementById("detail-subject").textContent = ticket.subject;
    const priority = document.getElementById("detail-priority");
    priority.className = `priority ${priorityClassName(ticket.priority)}`;
    priority.textContent = ticket.priority;
    document.getElementById("detail-owner").textContent = ticket.createdBy;
    document.getElementById("detail-assignee").textContent = ticket.assignedTo || "Não atribuído";
    document.getElementById("detail-date").textContent = TICKET_DATE_FORMATTER.format(new Date(ticket.createdAt));
    document.getElementById("detail-description").textContent = ticket.description;
    document.getElementById("detail-status").value = ticket.status;
    document.getElementById("detail-status-field").hidden = !state.isAdmin && !state.isSupport;
    document.getElementById("detail-actions").hidden = !state.isAdmin && !state.isSupport;
    document.getElementById("claim-ticket").hidden = !state.isSupport || Boolean(ticket.assignedTo) || ticket.status === "Resolvido";
    document.getElementById("ticket-assignment-note").textContent = state.isSupport
      ? ticket.assignedTo === state.currentUser
        ? `Você assumiu este chamado como ${state.currentUser}.`
        : ticket.assignedTo
          ? `Este chamado está sendo atendido por ${ticket.assignedTo}.`
          : "Assuma o chamado para iniciar o atendimento."
      : "";
    document.getElementById("detail-status").disabled = state.isSupport && ticket.assignedTo !== state.currentUser;
    document.getElementById("save-detail-status").disabled = state.isSupport && ticket.assignedTo !== state.currentUser;
    document.getElementById("save-detail-status").textContent = ticket.status === "Resolvido"
      ? "Salvar alterações"
      : "Salvar atendimento";
    closeNotifications();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showTicketList() {
    currentTicketId = "";
    ticketDetailView.hidden = true;
    dashboardView.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function assumeTicket(ticketId) {
    if (!state.isSupport || !loadTickets()) return false;
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket || ticket.status === "Resolvido") return false;
    if (ticket.assignedTo && ticket.assignedTo !== state.currentUser) {
      render();
      showToast(`Este chamado já foi assumido por ${ticket.assignedTo}.`);
      return false;
    }
    if (ticket.assignedTo === state.currentUser) return true;

    ticket.assignedTo = state.currentUser;
    if (!saveTickets()) {
      ticket.assignedTo = "";
      render();
      return false;
    }
    render();
    openTicketDetails(ticketId);
    showToast(`Chamado ${ticketId} assumido por ${state.currentUser}.`);
    return true;
  }

  function deleteTicket(ticketId) {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket || !canManageTicket(ticket) || !window.confirm(`Excluir o chamado ${ticketId}? Esta ação não pode ser desfeita.`)) return;

    const previousTickets = [...tickets];
    tickets.splice(0, tickets.length, ...tickets.filter((item) => item.id !== ticketId));
    if (!saveTickets()) {
      tickets.splice(0, tickets.length, ...previousTickets);
      return;
    }
    render();
    showToast(`Chamado ${ticketId} excluído.`);
  }

  function createTicketId() {
    let id;
    do {
      id = `AT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    } while (tickets.some((ticket) => ticket.id === id));
    return id;
  }

  function openModal(ticket = null) {
    if (ticket && typeof ticket.id === "string" && !canManageTicket(ticket)) return;
    if (ticket && typeof ticket.id !== "string") ticket = null;
    editingTicketId = ticket ? ticket.id : "";
    form.reset();
    ticketStatusField.hidden = !ticket || !state.isAdmin;
    document.getElementById("modal-title").textContent = ticket ? "Editar chamado" : "Abrir chamado";
    document.getElementById("modal-description").textContent = ticket
      ? "Atualize os dados e o status desta solicitação."
      : "Descreva o que está acontecendo para que possamos ajudar.";
    document.getElementById("ticket-submit").textContent = ticket ? "Salvar alterações" : "Enviar chamado";
    if (ticket) {
      document.getElementById("subject").value = ticket.subject;
      document.getElementById("priority").value = ticket.priority;
      document.getElementById("description").value = ticket.description;
      ticketStatus.value = ticket.status;
    }
    modal.hidden = false;
    document.getElementById("subject").focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.getElementById(state.isAdmin || state.isSupport ? "search" : "open-modal").focus();
  }

  function render() {
    const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
    const selectedPriority = priorityFilter.value;
    const availableTickets = getVisibleTickets();
    const visibleTickets = availableTickets.filter((ticket) => {
      const matchesQuery = `${ticket.id} ${ticket.subject} ${ticket.description} ${ticket.createdBy}`.toLocaleLowerCase("pt-BR").includes(query);
      return matchesQuery && (!selectedPriority || ticket.priority === selectedPriority);
    });

    document.getElementById("owner-column").hidden = !state.isAdmin && !state.isSupport;
    document.getElementById("assignee-column").hidden = !state.isAdmin && !state.isSupport;
    document.getElementById("actions-column").hidden = false;
    ticketList.replaceChildren();
    for (const ticket of visibleTickets) {
      const row = document.createElement("tr");
      const ticketCell = document.createElement("td");
      const ownerCell = document.createElement("td");
      const assigneeCell = document.createElement("td");
      const id = document.createElement("span");
      const subject = document.createElement("span");
      const description = document.createElement("span");
      const priorityCell = document.createElement("td");
      const priority = document.createElement("span");
      const dateCell = document.createElement("td");
      const statusCell = document.createElement("td");
      const status = state.isAdmin ? document.createElement("select") : document.createElement("span");

      id.className = "ticket-id";
      id.textContent = ticket.id;
      subject.className = "ticket-title";
      subject.textContent = ticket.subject;
      description.className = "ticket-description";
      description.textContent = ticket.description;
      ticketCell.append(id, subject, description);
      ownerCell.textContent = ticket.createdBy;
      assigneeCell.textContent = ticket.assignedTo || "Não atribuído";
      priority.className = `priority ${priorityClassName(ticket.priority)}`;
      priority.textContent = ticket.priority;
      priorityCell.append(priority);
      dateCell.textContent = TICKET_DATE_FORMATTER.format(new Date(ticket.createdAt));
      if (state.isAdmin) {
        status.className = "status-select";
        status.setAttribute("aria-label", `Status do chamado ${ticket.id}`);
        for (const statusName of STATUSES) {
          const option = document.createElement("option");
          option.value = statusName;
          option.textContent = statusName;
          status.append(option);
        }
        status.value = ticket.status;
        status.addEventListener("change", () => updateTicketStatus(ticket.id, status.value));
      } else {
        status.className = ticket.status === "Resolvido" ? "status status-resolvido" : "status";
        status.textContent = ticket.status;
      }
      statusCell.append(status);
      row.append(ticketCell);
      if (state.isAdmin || state.isSupport) row.append(ownerCell, assigneeCell);
      row.append(priorityCell, dateCell, statusCell);

      if (state.isAdmin || state.isSupport || canManageTicket(ticket)) {
        const actionsCell = document.createElement("td");
        const actions = document.createElement("div");
        const detailsButton = document.createElement("button");
        actions.className = "ticket-actions";
        detailsButton.className = "table-action";
        detailsButton.type = "button";
        detailsButton.textContent = state.isSupport ? "Atender" : "Detalhes";
        detailsButton.setAttribute("aria-label", `Ver chamado ${ticket.id}`);
        detailsButton.addEventListener("click", () => openTicketDetails(ticket.id));
        actions.append(detailsButton);

        if (state.isAdmin || canManageTicket(ticket)) {
          const editButton = document.createElement("button");
          const deleteButton = document.createElement("button");
          editButton.className = "table-action";
          editButton.type = "button";
          editButton.textContent = "Editar";
          editButton.setAttribute("aria-label", `Editar chamado ${ticket.id}`);
          editButton.addEventListener("click", () => openModal(ticket));
          deleteButton.className = "table-action delete";
          deleteButton.type = "button";
          deleteButton.textContent = "Excluir";
          deleteButton.setAttribute("aria-label", `Excluir chamado ${ticket.id}`);
          deleteButton.addEventListener("click", () => deleteTicket(ticket.id));
          actions.append(editButton, deleteButton);
        }
        actionsCell.append(actions);
        row.append(actionsCell);
      }
      ticketList.append(row);
    }

    const hasTickets = visibleTickets.length > 0;
    const emptyState = document.getElementById("empty-state");
    emptyState.hidden = hasTickets;
    if (!hasTickets && availableTickets.length > 0) {
      document.getElementById("empty-title").textContent = "Nenhum chamado encontrado";
      document.getElementById("empty-description").textContent = "Tente ajustar sua busca ou o filtro de prioridade.";
    } else {
      document.getElementById("empty-title").textContent = state.isAdmin
        ? "Nenhum chamado cadastrado"
        : state.isSupport
          ? "Nenhum chamado na fila"
          : "Nenhum chamado por aqui";
      document.getElementById("empty-description").textContent = state.isAdmin || state.isSupport
        ? "As solicitações dos usuários aparecerão aqui."
        : "Abra seu primeiro chamado para falar com o time de TI.";
    }

    updateStats();
    onChange();
  }

  function handleStorageChange(event) {
    if (event.key !== TICKET_STORAGE_KEY || (!state.isAdmin && !state.isSupport)) return;
    const previousIds = new Set(tickets.map((ticket) => ticket.id));
    if (!loadTickets()) {
      render();
      return;
    }
    render();

    const newTickets = tickets.filter((ticket) => !previousIds.has(ticket.id) && ticket.status !== "Resolvido");
    if (newTickets.length > 0) {
      showToast(`Novo chamado de ${newTickets[0].createdBy}: ${newTickets[0].subject}`);
    }

    if (currentTicketId) {
      const currentTicket = tickets.find((ticket) => ticket.id === currentTicketId);
      if (currentTicket && (state.isAdmin || canSupportAccess(currentTicket))) {
        openTicketDetails(currentTicketId);
      } else {
        showTicketList();
        showToast("Este chamado foi assumido por outro atendente.");
      }
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const existingTicket = editingTicketId ? tickets.find((item) => item.id === editingTicketId) : null;
    if (editingTicketId && (!existingTicket || !canManageTicket(existingTicket))) return;
    const ticket = {
      id: editingTicketId || createTicketId(),
      subject: formData.get("subject").trim(),
      priority: formData.get("priority"),
      description: formData.get("description").trim(),
      status: editingTicketId ? (state.isAdmin ? formData.get("status") : existingTicket.status) : "Em andamento",
      assignedTo: editingTicketId ? existingTicket.assignedTo : "",
      createdBy: editingTicketId ? existingTicket.createdBy : state.currentUser,
      createdAt: editingTicketId ? existingTicket.createdAt : new Date().toISOString()
    };
    if (!ticket.subject || !ticket.description) return;

    const previousTickets = [...tickets];
    if (editingTicketId) {
      const index = tickets.findIndex((item) => item.id === editingTicketId);
      tickets[index] = ticket;
    } else {
      tickets.unshift(ticket);
    }
    if (!saveTickets()) {
      tickets.splice(0, tickets.length, ...previousTickets);
      return;
    }

    const wasEditing = Boolean(editingTicketId);
    form.reset();
    render();
    closeModal();
    showToast(wasEditing ? `Chamado ${ticket.id} atualizado.` : `Chamado ${ticket.id} aberto com sucesso!`);
  });

  document.getElementById("open-modal").addEventListener("click", () => openModal());
  document.getElementById("close-modal").addEventListener("click", closeModal);
  document.getElementById("cancel-modal").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.getElementById("back-to-tickets").addEventListener("click", showTicketList);
  document.getElementById("claim-ticket").addEventListener("click", () => {
    if (currentTicketId) assumeTicket(currentTicketId);
  });
  document.getElementById("save-detail-status").addEventListener("click", () => {
    if (!currentTicketId || (!state.isAdmin && !state.isSupport)) return;
    const ticket = tickets.find((item) => item.id === currentTicketId);
    if (!ticket) {
      showTicketList();
      showToast("Este chamado não está mais disponível.");
      return;
    }

    const newStatus = document.getElementById("detail-status").value;
    if (ticket.status === newStatus) {
      showToast("O atendimento está atualizado.");
      return;
    }
    if (!updateTicketStatus(currentTicketId, newStatus)) return;
    document.getElementById("save-detail-status").textContent = newStatus === "Resolvido"
      ? "Salvar alterações"
      : "Salvar atendimento";
    showToast(newStatus === "Resolvido" ? "Chamado marcado como resolvido." : "Atendimento atualizado.");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
  searchInput.addEventListener("input", render);
  priorityFilter.addEventListener("change", render);
  window.addEventListener("storage", handleStorageChange);

  return {
    getTickets: () => [...tickets],
    load() {
      const loaded = loadTickets();
      render();
      return loaded;
    },
    render,
    openTicketDetails,
    showTicketList,
    canSupportAccess
  };
}
