
const ULT_DEFINITION =
    "Ult means Ultimate: a champion's powerful ability, usually with a longer cooldown.";

export function initInspector(root, goToSandbox, goToRoster) {
    return function openChampion(champion) {
        root.replaceChildren();
        root.className = "inspector-panel";

        const heading = document.createElement("div");
        heading.className = "inspector-heading";

        const title = document.createElement("h2");
        title.textContent = `${champion.name} — Abilities`;

        heading.append(title);

        const note = document.createElement("p");
        note.className = "muted";
        note.textContent =
            "Select an ability's detailed math to explore cooldowns, " +
            "resource costs, and numerical examples. Values may change " +
            "with game patches.";

        const grid = document.createElement("div");
        grid.className = "ability-grid";

        for (const ability of champion.abilities) {
            const card = document.createElement("article");
            card.className = "ability-card";

            const name = document.createElement("h3");
            name.textContent = `${ability.key} — ${ability.name}`;

            const description = document.createElement("p");
            description.textContent = ability.summary;

            if (ability.ult) {
                const term = document.createElement("button");
                term.type = "button";
                term.className = "jargon-term";
                term.textContent = "ult";
                term.setAttribute("aria-expanded", "false");

                const tooltip = document.createElement("span");
                tooltip.className = "inline-tooltip";
                tooltip.textContent = ULT_DEFINITION;
                tooltip.hidden = true;

                term.addEventListener("click", () => {
                    tooltip.hidden = !tooltip.hidden;
                    term.setAttribute(
                        "aria-expanded",
                        String(!tooltip.hidden)
                    );
                });

                description.append(" (", term, tooltip, ")");
            }

            const toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "detail-toggle";

            const details = document.createElement("div");
            details.className = "ability-details";
            details.id = `ability-details-${champion.id}-${ability.key}`;

            toggle.setAttribute("aria-controls", details.id);

            const explanation = document.createElement("p");
            explanation.textContent = ability.detail;
            details.append(explanation);

            const numbers = ability.numbers;

            if (numbers) {
                const cooldown = document.createElement("p");

                if (numbers.cooldowns.length > 0) {
                    cooldown.textContent =
                        "Cooldown by ability rank: " +
                        numbers.cooldowns.join(" / ") +
                        " seconds.";
                } else {
                    cooldown.textContent =
                        "Cooldown: No regular timed cooldown. " +
                        "Activation depends on meeting the ability's requirements.";
                }

                details.append(cooldown);

                const cost = document.createElement("p");
                cost.textContent = `Resource cost: ${numbers.cost}.`;
                details.append(cost);

                if (numbers.extra) {
                    const extra = document.createElement("p");
                    extra.textContent = numbers.extra;
                    details.append(extra);
                }

                if (numbers.example) {
                    const example = document.createElement("p");
                    example.textContent = numbers.example;
                    details.append(example);
                }

                if (
                    numbers.cooldowns.length > 0 &&
                    !numbers.skipHasteExample
                ) {
                    const original = numbers.cooldowns[0];
                    const haste = 50;

                    const adjusted = Math.round(
                        (original * 100 / (100 + haste)) * 10
                    ) / 10;

                    const math = document.createElement("p");

                    math.textContent =
                        "Ability Haste example (rank 1): " +
                        `${original} × 100 / (100 + ${haste}) = ` +
                        `${adjusted} seconds. ` +
                        "This example assumes 50 Ability Haste.";

                    details.append(math);
                }
            }

            const storageKey =
                `summoner101-details-${champion.id}-${ability.key}`;

            let expanded = false;

            try {
                expanded =
                    localStorage.getItem(storageKey) === "true";
            } catch (error) {
                console.warn("Local storage is unavailable.");
            }

            function refreshDetails() {
                details.hidden = !expanded;

                toggle.textContent = expanded
                    ? "− Hide detailed math"
                    : "+ Show detailed math";

                toggle.setAttribute(
                    "aria-expanded",
                    String(expanded)
                );
            }

            toggle.addEventListener("click", () => {
                expanded = !expanded;

                try {
                    localStorage.setItem(
                        storageKey,
                        String(expanded)
                    );
                } catch (error) {
                    console.warn(
                        "Unable to save detail preference."
                    );
                }

                refreshDetails();
            });

            refreshDetails();

            card.append(name, description, toggle, details);
            grid.append(card);
        }

        root.append(heading, note, grid);

        const navigation = document.createElement("div");
        navigation.className = "page-navigation";

        const backButton = document.createElement("button");
        backButton.type = "button";
        backButton.className = "secondary-button";
        backButton.textContent = "← Back to Champions";
        backButton.addEventListener("click", goToRoster);

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.textContent = "Continue to Sandbox →";
        nextButton.addEventListener("click", goToSandbox);

        navigation.append(backButton, nextButton);
        root.append(navigation);
    };
}
