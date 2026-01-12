// ===============================
// API
// ===============================
const API_KEY = "50c41ef5-a738-4f61-869e-0fa04dc0d8db";
const API_BASE = "http://exam-api-courses.std-900.ist.mospolytech.ru";

const API_ORDERS = `${API_BASE}/api/orders`;


// ===============================
// УВЕДОМЛЕНИЯ
// ===============================
function showNotification(message, type = "info") {
    const area = document.getElementById("notificationArea");
    if (!area) return;

    const alert = document.createElement("div");
    alert.className = `alert alert-${type} mt-2`;
    alert.textContent = message;

    area.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}


// ===============================
// ЗАЯВКИ + ПАГИНАЦИЯ
// ===============================
let orders = [];
let currentOrdersPage = 1;
const ORDERS_PER_PAGE = 5;

async function loadOrders() {
    try {
        const res = await fetch(`${API_ORDERS}?api_key=${API_KEY}`);
        orders = await res.json();

        currentOrdersPage = 1;
        renderOrders();
        renderOrdersPagination();

    } catch (err) {
        showNotification("Ошибка загрузки заявок", "danger");
    }
}

function renderOrders() {
    const tbody = document.getElementById("ordersTable");
    if (!tbody) return;

    tbody.innerHTML = "";

    const start = (currentOrdersPage - 1) * ORDERS_PER_PAGE;
    const pageItems = orders.slice(start, start + ORDERS_PER_PAGE);

    pageItems.forEach(order => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${order.id}</td>
            <td>${order.course_name || "-"}</td>
            <td>${order.tutor_name || "-"}</td>
            <td>${order.date_start}</td>
            <td>${order.time_start}</td>
            <td>${order.persons}</td>
            <td>${order.price}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1">Редактировать</button>
                <button class="btn btn-sm btn-outline-danger">Удалить</button>
            </td>
        `;

        const [editBtn, deleteBtn] = tr.querySelectorAll("button");

        editBtn.onclick = () => openEditOrderModal(order);
        deleteBtn.onclick = () => deleteOrder(order.id);

        tbody.appendChild(tr);
    });
}

function renderOrdersPagination() {
    const ul = document.getElementById("ordersPagination");
    if (!ul) return;

    ul.innerHTML = "";

    const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE) || 1;

    for (let page = 1; page <= totalPages; page++) {
        const li = document.createElement("li");
        li.className = `page-item ${page === currentOrdersPage ? "active" : ""}`;

        li.innerHTML = `<button class="page-link">${page}</button>`;

        li.querySelector("button").onclick = () => {
            currentOrdersPage = page;
            renderOrders();
            renderOrdersPagination();
        };

        ul.appendChild(li);
    }
}


// ===============================
// РЕДАКТИРОВАНИЕ ЗАЯВКИ (PUT)
// ===============================
function openEditOrderModal(order) {
    document.getElementById("editOrderId").value = order.id;
    document.getElementById("editOrderDate").value = order.date_start;
    document.getElementById("editOrderTime").value = order.time_start;
    document.getElementById("editOrderPersons").value = order.persons;
    document.getElementById("editOrderPrice").value = order.price;

    new bootstrap.Modal(document.getElementById("editOrderModal")).show();
}

async function saveOrderChanges() {
    try {
        const id = document.getElementById("editOrderId").value;

        const body = {
            date_start: document.getElementById("editOrderDate").value,
            time_start: document.getElementById("editOrderTime").value,
            persons: Number(document.getElementById("editOrderPersons").value),
            price: Number(document.getElementById("editOrderPrice").value)
        };

        const res = await fetch(`${API_ORDERS}/${id}?api_key=${API_KEY}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const result = await res.json();
        if (result.error) throw new Error(result.error);

        showNotification("Заявка обновлена", "success");
        bootstrap.Modal.getInstance(document.getElementById("editOrderModal")).hide();

        await loadOrders();

    } catch (err) {
        showNotification("Ошибка обновления заявки", "danger");
    }
}


// ===============================
// УДАЛЕНИЕ ЗАЯВКИ (DELETE)
// ===============================
async function deleteOrder(id) {
    if (!confirm("Удалить эту заявку?")) return;

    try {
        const res = await fetch(`${API_ORDERS}/${id}?api_key=${API_KEY}`, {
            method: "DELETE"
        });

        const result = await res.json();
        if (result.error) throw new Error(result.error);

        showNotification("Заявка удалена", "success");
        await loadOrders();

    } catch (err) {
        showNotification("Ошибка удаления заявки", "danger");
    }
}


// ===============================
// ИНИЦИАЛИЗАЦИЯ
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    loadOrders();

    const saveBtn = document.getElementById("saveOrderChangesBtn");
    if (saveBtn) saveBtn.onclick = saveOrderChanges;
});
