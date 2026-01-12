// ===============================
// API
// ===============================
const API_KEY = "50c41ef5-a738-4f61-869e-0fa04dc0d8db";
const API_BASE = "http://exam-api-courses.std-900.ist.mospolytech.ru";

const API_COURSES = `${API_BASE}/api/courses`;
const API_TUTORS = `${API_BASE}/api/tutors`;
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
// КУРСЫ
// ===============================
let courses = [];

async function loadCourses() {
    try {
        const res = await fetch(`${API_COURSES}?api_key=${API_KEY}`);
        courses = await res.json();
        renderCourses();
    } catch (err) {
        showNotification("Ошибка загрузки курсов", "danger");
    }
}

function renderCourses() {
    const container = document.getElementById("coursesContainer");
    if (!container) return;

    container.innerHTML = "";

    courses.forEach(course => {
        const col = document.createElement("div");
        col.className = "col-md-4 mb-3";

        col.innerHTML = `
            <div class="p-3 border rounded h-100">
                <h5>${course.name}</h5>
                <p><strong>Уровень:</strong> ${course.level}</p>
                <p title="${course.description}">${course.description.slice(0, 120)}...</p>
                <button class="btn btn-primary btn-sm" onclick="openCourseOrderModal(${course.id})">
                    Оформить заявку
                </button>
            </div>
        `;

        container.appendChild(col);
    });
}


// ===============================
// РЕПЕТИТОРЫ
// ===============================
let tutors = [];
let selectedTutorId = null;
let currentCourseData = null;
let currentTutorData = null;

async function loadTutors() {
    try {
        const res = await fetch(`${API_TUTORS}?api_key=${API_KEY}`);
        tutors = await res.json();
        renderTutors();
    } catch (err) {
        showNotification("Ошибка загрузки репетиторов", "danger");
    }
}

function renderTutors() {
    const tbody = document.getElementById("tutorsTable");
    if (!tbody) return;

    tbody.innerHTML = "";

    tutors.forEach(tutor => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${tutor.name}</td>
            <td>${tutor.language_level}</td>
            <td>${tutor.languages_spoken.join(", ")}</td>
            <td>${tutor.work_experience}</td>
            <td>${tutor.price_per_hour}</td>
            <td><button class="btn btn-outline-primary btn-sm">Выбрать</button></td>
        `;

        tr.querySelector("button").onclick = () => {
            openTutorOrderModal(tutor.id);
        };

        tbody.appendChild(tr);
    });
}


// ===============================
// МОДАЛКА ДЛЯ КУРСА
// ===============================
async function openCourseOrderModal(courseId) {
    try {
        const res = await fetch(`${API_COURSES}/${courseId}?api_key=${API_KEY}`);
        const course = await res.json();

        currentCourseData = course;
        currentTutorData = null;
        selectedTutorId = null;

        document.getElementById("courseNameField").value = course.name;
        document.getElementById("courseTeacherField").value = course.teacher;

        const date = course.start_dates[0].split("T")[0];
        const time = course.start_dates[0].split("T")[1].slice(0, 5);

        document.getElementById("courseDateSelect").value = date;
        document.getElementById("courseTimeSelect").innerHTML = `<option>${time}</option>`;
        document.getElementById("courseDurationField").value =
            `${course.total_length} недель`;

        document.getElementById("studentsNumberField").value = 1;

        const totalHours = course.total_length * course.week_length;
        document.getElementById("totalPriceField").value =
            totalHours * course.course_fee_per_hour;

        new bootstrap.Modal(document.getElementById("courseOrderModal")).show();

    } catch (err) {
        showNotification("Ошибка загрузки данных курса", "danger");
    }
}


// ===============================
// МОДАЛКА ДЛЯ РЕПЕТИТОРА
// ===============================
function openTutorOrderModal(tutorId) {
    const tutor = tutors.find(t => t.id === tutorId);
    if (!tutor) {
        showNotification("Ошибка загрузки данных репетитора", "danger");
        return;
    }

    currentCourseData = null;
    currentTutorData = tutor;
    selectedTutorId = tutorId;

    document.getElementById("courseNameField").value = "Индивидуальные занятия";
    document.getElementById("courseTeacherField").value = tutor.name;

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("courseDateSelect").value = today;

    const defaultTime = "18:00";
    document.getElementById("courseTimeSelect").innerHTML =
        `<option value="${defaultTime}">${defaultTime}</option>`;

    document.getElementById("courseDurationField").value = "1 занятие";

    document.getElementById("studentsNumberField").value = 1;
    document.getElementById("totalPriceField").value = tutor.price_per_hour;

    new bootstrap.Modal(document.getElementById("courseOrderModal")).show();
}


// ===============================
// ОТПРАВКА ЗАЯВКИ
// ===============================
async function submitCourseOrder() {
    try {
        const date = document.getElementById("courseDateSelect").value;
        const time = document.getElementById("courseTimeSelect").value;
        const persons = Number(document.getElementById("studentsNumberField").value);
        const price = Number(document.getElementById("totalPriceField").value);

        let body;

        if (currentCourseData) {
            body = {
                course_id: currentCourseData.id,
                tutor_id: selectedTutorId || 0,
                date_start: date,
                time_start: time,
                duration: currentCourseData.total_length * currentCourseData.week_length,
                persons: persons,
                price: price
            };
        } else if (currentTutorData) {
            body = {
                course_id: 0,
                tutor_id: currentTutorData.id,
                date_start: date,
                time_start: time,
                duration: 1,
                persons: persons,
                price: currentTutorData.price_per_hour * persons
            };
        } else {
            showNotification("Не выбран курс или репетитор", "danger");
            return;
        }

        const res = await fetch(`${API_ORDERS}?api_key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const result = await res.json();
        if (result.error) throw new Error(result.error);

        showNotification("Заявка отправлена", "success");
        bootstrap.Modal.getInstance(document.getElementById("courseOrderModal")).hide();

    } catch (err) {
        showNotification("Ошибка отправки заявки", "danger");
    }
}


// ===============================
// ИНИЦИАЛИЗАЦИЯ
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    loadCourses();
    loadTutors();

    const submitBtn = document.getElementById("submitCourseOrderBtn");
    if (submitBtn) submitBtn.onclick = submitCourseOrder;
});
