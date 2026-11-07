
import { initRoster } from "./roster.js";
import { initInspector } from "./inspector.js";
import { initSandbox } from "./sandbox.js";

const rosterButton = document.getElementById("roster-btn");
const abilitiesButton = document.getElementById("abilities-btn");
const sandboxButton = document.getElementById("sandbox-btn");

const rosterPage = document.getElementById("roster-page");
const abilitiesPage = document.getElementById("abilities-page");
const sandboxPage = document.getElementById("sandbox-page");

let selectedChampion = null;

// NAVIGATION

function showPage(page) {
    if (page !== "roster" && !selectedChampion) {
        return;
    }

    rosterPage.hidden = page !== "roster";
    abilitiesPage.hidden = page !== "abilities";
    sandboxPage.hidden = page !== "sandbox";

    rosterButton.classList.toggle(
        "active",
        page === "roster"
    );

    abilitiesButton.classList.toggle(
        "active",
        page === "abilities"
    );

    sandboxButton.classList.toggle(
        "active",
        page === "sandbox"
    );

    window.scrollTo(0, 0);
}

function updateNavigation() {
    const hasChampion = selectedChampion !== null;

    abilitiesButton.disabled = !hasChampion;
    sandboxButton.disabled = !hasChampion;
}

// HEADER BUTTONS

rosterButton.addEventListener("click", () => {
    showPage("roster");
});

abilitiesButton.addEventListener("click", () => {
    showPage("abilities");
});

sandboxButton.addEventListener("click", () => {
    showPage("sandbox");
});

// SANDBOX NAVIGATION

document.getElementById("sandbox-back")
    .addEventListener("click", () => {
        showPage("abilities");
    });

document.getElementById("sandbox-roster")
    .addEventListener("click", () => {
        showPage("roster");
    });

// CHAMPION SELECTION

function selectChampion(champion, openInspector) {
    selectedChampion = champion;

    openInspector(champion);

    updateNavigation();

    // Automatically move to screen 2.
    showPage("abilities");
}

// JSON LOADING

async function loadJSON(path) {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Failed to load ${path}`);
    }

    return response.json();
}

// INITIALIZATION

async function start() {
    try {
        const [champions, items, scenarios] =
            await Promise.all([
                loadJSON("data/champions.json"),
                loadJSON("data/items.json"),
                loadJSON("data/scenarios.json")
            ]);

        const openInspector = initInspector(
            document.getElementById("ability-inspector"),

            // Move forward to Sandbox.
            () => showPage("sandbox"),

            // Move backward to Champion Picker.
            () => showPage("roster")
        );

        initRoster(
            document.querySelector(".filter-grid"),
            document.querySelector(".champion-grid"),
            champions,
            (champion) => {
                selectChampion(champion, openInspector);
            }
        );

        initSandbox(
            document.getElementById("sandbox-content"),
            items,
            scenarios
        );

        updateNavigation();
        showPage("roster");

    } catch (error) {
        console.error(error);

        const banner = document.createElement("p");
        banner.className = "error-banner";

        banner.textContent =
            "Unable to load project data. " +
            "Please open index.html using Live Server.";

        document.querySelector("main").prepend(banner);
    }
}

start();
