let map;
let clusterer;

// Все точки прямо в коде
const allPoints = [
    {
        name: "Exam Courses — Центральный офис",
        description: "Главный учебный центр",
        type: "education",
        coords: [55.751244, 37.618423]
    },
    {
        name: "Городская библиотека №12",
        description: "Большой выбор учебных материалов",
        type: "libraries",
        coords: [55.758, 37.62]
    },
    {
        name: "Центр культуры и языка",
        description: "Языковые мероприятия и клубы",
        type: "centers",
        coords: [55.745, 37.60]
    },
    {
        name: "Language Café Moscow",
        description: "Разговорные клубы и встречи",
        type: "cafes",
        coords: [55.76, 37.63]
    }
];

document.addEventListener("DOMContentLoaded", () => {
    ymaps.ready(initMap);
});

function initMap() {
    map = new ymaps.Map("map", {
        center: [55.751244, 37.618423],
        zoom: 11,
        controls: ["zoomControl"]
    });

    clusterer = new ymaps.Clusterer({
        preset: "islands#invertedBlueClusterIcons",
        groupByCoordinates: false
    });

    renderPoints();
    setupFilters();
    setupSearch();
}

function renderPoints() {
    clusterer.removeAll();

    const activeTypes = getActiveFilters();
    const searchQuery = document.getElementById("map-search").value.trim().toLowerCase();

    const filtered = allPoints.filter(p => {
        const matchesType = activeTypes.includes(p.type);
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery) ||
            p.description.toLowerCase().includes(searchQuery);

        return matchesType && matchesSearch;
    });

    const placemarks = filtered.map(p => {
        return new ymaps.Placemark(p.coords, {
            balloonContentHeader: `<strong>${p.name}</strong>`,
            balloonContentBody: p.description,
            balloonContentFooter: `<em>${p.type}</em>`
        }, {
            preset: "islands#blueIcon"
        });
    });

    clusterer.add(placemarks);
    map.geoObjects.add(clusterer);
}

function getActiveFilters() {
    const filters = [];

    if (document.getElementById("filter-education").checked) filters.push("education");
    if (document.getElementById("filter-libraries").checked) filters.push("libraries");
    if (document.getElementById("filter-centers").checked) filters.push("centers");
    if (document.getElementById("filter-cafes").checked) filters.push("cafes");

    return filters;
}

function setupFilters() {
    document.querySelectorAll("#map-filters input").forEach(ch => {
        ch.addEventListener("change", renderPoints);
    });
}

function setupSearch() {
    document.getElementById("map-search-btn").onclick = renderPoints;

    document.getElementById("map-search").addEventListener("input", () => {
        renderPoints();
    });
}
