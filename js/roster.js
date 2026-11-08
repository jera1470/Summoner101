
const options = [
    {
        key: "range",
        title: "Attack Range",
        values: [
            "Close-Range (Melee)",
            "Long-Range (Ranged)"
        ]
    },
    {
        key: "damage",
        title: "Damage Type",
        values: [
            "Physical Attacker",
            "Magic Attacker"
        ]
    },
    {
        key: "lane",
        title: "Lane Role",
        values: [
            "Solo Top",
            "Jungle",
            "Mid Lane",
            "Bot Lane",
            "Support"
        ]
    }
];

export function initRoster(
    filterRoot,
    cardRoot,
    champions,
    selectChampion
) {
    const filters = {
        range: null,
        damage: null,
        lane: null
    };

    let chosenId = null;

    filterRoot.innerHTML = "";

    function matching(champion) {
        return Object.entries(filters).every(([field, selection]) => {
            return !selection || champion[field] === selection;
        });
    }

    function draw() {
        const filterButtons = filterRoot.querySelectorAll(
            "[data-filter]"
        );

        for (const button of filterButtons) {
            const active =
                filters[button.dataset.filter] === button.dataset.value;

            button.classList.toggle("selected", active);
            button.setAttribute("aria-pressed", String(active));
        }

        cardRoot.innerHTML = "";

        for (const champion of champions) {
            const card = document.createElement("article");

            card.className = "champion-card";

            if (!matching(champion)) {
                card.classList.add("dimmed");
            }

            if (chosenId === champion.id) {
                card.classList.add("chosen");
            }

            const portrait = document.createElement("img");
            portrait.className = "champion-portrait";
            portrait.src = `assets/images/${champion.id}.jpg`;
            portrait.alt = `${champion.name} portrait`;

            const name = document.createElement("h3");
            name.textContent = champion.name;

            const description = document.createElement("p");
            description.textContent = champion.description;

            const select = document.createElement("button");
            select.type = "button";
            select.textContent = "View Champion";

            select.addEventListener("click", () => {
                chosenId = champion.id;
                draw();
                selectChampion(champion);
            });

            card.append(portrait, name, description, select);
            cardRoot.append(card);
        }
    }

    for (const group of options) {
        const box = document.createElement("div");
        box.className = "filter-group";

        const title = document.createElement("h4");
        title.textContent = group.title;

        box.append(title);

        for (const value of group.values) {
            const button = document.createElement("button");

            button.type = "button";
            button.dataset.filter = group.key;
            button.dataset.value = value;
            button.textContent = value;

            button.setAttribute("aria-pressed", "false");

            button.addEventListener("click", () => {
                filters[group.key] =
                    filters[group.key] === value ? null : value;

                draw();
            });

            box.append(button);
        }

        filterRoot.append(box);
    }

    draw();
}
