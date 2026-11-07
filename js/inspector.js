
const ULT_DEFINITION =
    "Ult means Ultimate: a champion's powerful ability, usually with a longer cooldown.";

export function initInspector(
    root,
    goToSandbox,
    goToRoster
) {
    let showDetails = false;

    try {
        showDetails =
            localStorage.getItem("summoner101-details") === "true";
    } catch (error) {
        console.warn("Local storage is unavailable.");
    }

    return function openChampion(champion) {
        root.innerHTML = "";
        root.className = "inspector-panel";

        // CHAMPION HEADING

        const heading = document.createElement("div");
        heading.className = "inspector-heading";

        const title = document.createElement("h2");
        title.textContent = champion.name + " — Abilities";

        heading.append(title);

        // ABILITY GRID

        const grid = document.createElement("div");
        grid.className = "ability-grid";

        const detailBlocks = [];
        const detailButtons = [];

        function refreshDetails() {
            for (const detail of detailBlocks) {
                detail.hidden = !showDetails;
            }

            for (const button of detailButtons) {
                button.textContent = showDetails
                    ? "− Hide detailed math"
                    : "+ Show detailed math";

                button.setAttribute(
                    "aria-expanded",
                    String(showDetails)
                );
            }
        }

        for (const ability of champion.abilities) {
            const card = document.createElement("article");
            card.className = "ability-card";

            // ABILITY TITLE

            const name = document.createElement("h3");
            name.textContent =
                ability.key + " — " + ability.name;

            // SHORT DESCRIPTION

            const description = document.createElement("p");
            description.textContent = ability.summary;

            // ULT TOOLTIP

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

                description.append(
                    " (",
                    term,
                    tooltip,
                    ")"
                );
            }

            // DETAILED INFORMATION

            const toggle = document.createElement("button");

            toggle.type = "button";
            toggle.className = "detail-toggle";

            const details = document.createElement("div");

            details.className = "ability-details";
            details.textContent = ability.detail;

            detailBlocks.push(details);
            detailButtons.push(toggle);

            toggle.addEventListener("click", () => {
                showDetails = !showDetails;

                try {
                    localStorage.setItem(
                        "summoner101-details",
                        String(showDetails)
                    );
                } catch (error) {
                    console.warn(
                        "Unable to save detail preference."
                    );
                }

                refreshDetails();
            });

            card.append(
                name,
                description,
                toggle,
                details
            );

            grid.append(card);
        }

        root.append(heading, grid);

        refreshDetails();

        // BACKWARD / FORWARD NAVIGATION

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
