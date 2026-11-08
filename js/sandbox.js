
const BASE = {
    health: 690,
    armor: 38,
    magicResist: 32,
    gold: 750
};

export function initSandbox(root, items, scenarios) {
    const itemById = Object.fromEntries(
        items.map(item => [item.id, item])
    );

    let currentChampion = null;
    let inventory = [null, null, null];
    let enemyIndex = 0;
    let pendingItem = null;
    let notice = "";

    function setChampion(champion) {
        currentChampion = champion;
        inventory = [null, null, null];
        enemyIndex = 0;
        pendingItem = null;
        notice = "";

        const introTitle = document.getElementById("sandbox-intro-title");
        const introDesc = document.getElementById("sandbox-intro-desc");
        if (introTitle && champion) {
            introTitle.textContent = `Practice Scenario: ${champion.name}`;
        }
        if (introDesc && champion) {
            introDesc.textContent =
                `This exercise uses ${champion.name} to demonstrate ` +
                "how defensive items work against Annie and Ashe.";
        }

        render();
    }

    function calculate() {
        const equipped = inventory
            .filter(Boolean)
            .map(id => itemById[id]);

        const enemy = scenarios[enemyIndex];

        const spent = equipped.reduce(
            (sum, item) => sum + item.cost, 0
        );

        const health = BASE.health + equipped.reduce(
            (sum, item) => sum + item.health, 0
        );

        const armor = BASE.armor + equipped.reduce(
            (sum, item) => sum + item.armor, 0
        );

        const magicResist = BASE.magicResist + equipped.reduce(
            (sum, item) => sum + item.magicResist, 0
        );

        const countered = inventory.includes(enemy.counter);

        const damage = countered
            ? enemy.counterDamage
            : enemy.damage;

        return {
            enemy,
            spent,
            gold: BASE.gold - spent,
            health,
            armor,
            magicResist,
            countered,
            damage,
            remaining: health - damage
        };
    }

    function remove(slot) {
        inventory[slot] = null;
        pendingItem = null;
        notice = "Item removed; gold refunded.";
        render();
    }

    function equip(id, slot) {
        if (!itemById[id] || slot < 0 || slot > 2) {
            return;
        }

        const next = [...inventory];
        const oldIndex = next.indexOf(id);

        if (oldIndex !== -1) {
            next[oldIndex] = null;
        }

        next[slot] = id;

        const cost = next.reduce((sum, itemId) => {
            return sum + (itemId ? itemById[itemId].cost : 0);
        }, 0);

        if (cost > BASE.gold) {
            const available = calculate().gold;

            notice =
                `Not enough gold. ${itemById[id].name} costs ` +
                `${itemById[id].cost} gold. You have ${available} ` +
                `gold remaining. This combination costs ${cost} gold.`;
        } else {
            inventory = next;
            notice = "";
        }

        pendingItem = null;
        render();
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);

        if (className) {
            node.className = className;
        }

        if (text !== undefined) {
            node.textContent = text;
        }

        return node;
    }

    function section(title) {
        const panel = el("section", "sandbox-panel");
        panel.append(el("h3", "", title));
        return panel;
    }

    function render() {
        const result = calculate();
        const champName = currentChampion ? currentChampion.name : "Champion";
        root.innerHTML = "";

        // TOP TOOLBAR

        const bar = el("div", "sandbox-topbar");
        const playerBadge = el("div", "sandbox-player-badge");

        if (currentChampion) {
            const playerImg = el("img", "sandbox-player-img");
            playerImg.src = `assets/images/${currentChampion.id}.jpg`;
            playerImg.alt = `${champName} portrait`;
            playerBadge.append(playerImg);
        }

        playerBadge.append(
            el("span", "", `${champName.toUpperCase()} · LEVEL 1 · PRACTICE SCENARIO`)
        );

        bar.append(playerBadge);

        const reset = el("button", "", "Reset Scenario");
        reset.type = "button";

        reset.addEventListener("click", () => {
            inventory = [null, null, null];
            enemyIndex = 0;
            pendingItem = null;
            notice = "Scenario reset.";
            render();
        });

        bar.append(reset);
        root.append(bar);

        // INCOMING THREAT

        const threat = section("Incoming Threat");
        const enemyHeader = el("div", "enemy-header");

        const portrait = el(
            "img",
            "enemy-portrait"
        );
        portrait.src = `assets/images/${result.enemy.id}.jpg`;
        portrait.alt = `${result.enemy.name} portrait`;

        const enemyText = el("div", "enemy-labels");

        enemyText.append(
            el("h4", "",
                `${result.enemy.name} — ${result.enemy.role}`)
        );

        const term = el(
            "button",
            "jargon-term",
            `${result.enemy.type} damage`
        );

        term.type = "button";
        term.setAttribute("aria-expanded", "false");

        const tooltip = el(
            "span",
            "inline-tooltip",
            result.enemy.type === "magic"
                ? "Magic damage is reduced by Magic Resist."
                : "Physical damage is reduced by Armor."
        );

        tooltip.hidden = true;

        term.addEventListener("click", () => {
            tooltip.hidden = !tooltip.hidden;

            term.setAttribute(
                "aria-expanded",
                String(!tooltip.hidden)
            );
        });

        enemyText.append(term, tooltip);
        enemyHeader.append(portrait, enemyText);

        const switchButton = el(
            "button", "", "Switch Enemy"
        );

        switchButton.type = "button";

        switchButton.addEventListener("click", () => {
            enemyIndex = (enemyIndex + 1) % scenarios.length;
            notice = "";
            pendingItem = null;
            render();
        });

        enemyHeader.append(switchButton);
        threat.append(enemyHeader);

        threat.append(
            el(
                "p",
                "",
                `${result.damage} ${result.enemy.type} damage ` +
                `incoming · ${champName} has ${result.health} HP`
            )
        );

        const track = el("div", "threat-track");

        const gauge = el(
            "div",
            "threat-fill" +
            (result.remaining > 0 ? " safe" : "")
        );

        gauge.style.width =
            `${Math.min(100, result.damage / result.health * 100)}%`;

        track.append(gauge);
        threat.append(track);

        threat.append(
            el(
                "strong",
                "threat-status",
                result.remaining > 0
                    ? `Survives with ${result.remaining} HP`
                    : "Lethal Damage Detected"
            )
        );

        root.append(threat);

        // ACTIVE INVENTORY

        const slots = section("Active Inventory");

        slots.append(
            el(
                "p",
                "muted",
                `Gold remaining: ${result.gold} / ${BASE.gold}. ` +
                "Click an item then a slot, or drag items between " +
                "the bench and inventory."
            )
        );

        const grid = el("div", "inventory-grid");

        inventory.forEach((id, index) => {
            const slot = el(
                "button",
                "inventory-slot",
                id
                    ? `${itemById[id].name}\nClick to remove`
                    : `Slot ${index + 1}\nDrop item here`
            );

            slot.type = "button";

            if (id) {
                slot.classList.add("filled");

                if (id === result.enemy.counter) {
                    slot.classList.add("counter");
                } else if (itemById[id].health) {
                    slot.classList.add("health-item");
                } else {
                    slot.classList.add("ineffective");
                }

                slot.draggable = true;

                slot.addEventListener("dragstart", event => {
                    event.dataTransfer.setData("text/plain", id);
                    event.dataTransfer.effectAllowed = "move";
                });
            }

            slot.addEventListener("click", () => {
                if (pendingItem) {
                    equip(pendingItem, index);
                } else if (id) {
                    remove(index);
                }
            });

            slot.addEventListener("dragover", event => {
                event.preventDefault();
            });

            slot.addEventListener("drop", event => {
                event.preventDefault();

                const itemId =
                    event.dataTransfer.getData("text/plain");

                equip(itemId, index);
            });

            grid.append(slot);
        });

        slots.append(grid);

        slots.append(
            el(
                "p",
                "muted",
                `Health: ${result.health} · ` +
                `Armor: ${result.armor} · ` +
                `Magic Resist: ${result.magicResist} · ` +
                `Remaining HP: ${result.remaining}`
            )
        );

        root.append(slots);

        // ITEM BENCH

        const bench = section("Choose an Item");
        const benchGrid = el("div", "item-grid");

        for (const item of items) {
            const equipped = inventory.includes(item.id);

            const card = el(
                "button",
                "item-card" +
                (pendingItem === item.id ? " selected" : "")
            );

            card.type = "button";
            card.draggable = !equipped;

            card.append(
                el("strong", "", item.name),
                el("span", "",
                    `${item.description} · ${item.cost} Gold`),
                el("small", "",
                    equipped
                        ? "Equipped — remove from slot"
                        : "Click or drag to equip")
            );

            card.addEventListener("click", () => {
                if (equipped) {
                    notice =
                        "This item is already equipped. " +
                        "Click its slot to remove it.";
                } else {
                    pendingItem =
                        pendingItem === item.id ? null : item.id;

                    notice = pendingItem
                        ? `Select an inventory slot for ${item.name}.`
                        : "";
                }

                render();
            });

            card.addEventListener("dragstart", event => {
                if (equipped) {
                    event.preventDefault();
                    return;
                }

                event.dataTransfer.setData(
                    "text/plain",
                    item.id
                );

                event.dataTransfer.effectAllowed = "move";
            });

            benchGrid.append(card);
        }

        bench.append(benchGrid);

        bench.addEventListener("dragover", event => {
            event.preventDefault();
        });

        bench.addEventListener("drop", event => {
            event.preventDefault();

            const id =
                event.dataTransfer.getData("text/plain");

            const index = inventory.indexOf(id);

            if (index !== -1) {
                remove(index);
            }
        });

        root.append(bench);

        // COMBAT FEEDBACK

        const feedback = section("Combat Feedback");
        const message = el("div", "combat-message");

        if (notice) {
            message.textContent = notice;

            if (notice.startsWith("Not enough gold")) {
                message.classList.add("caution");
            }

        } else if (inventory.every(id => id === null)) {
            message.textContent =
                `${result.enemy.name} is attacking. ` +
                "Try Cloth Armor, Null-Magic Mantle, " +
                "or Ruby Crystal to see how defensive stats work.";

        } else if (result.countered) {
            message.classList.add("success");

            const explanation =
                result.enemy.type === "magic"
                    ? "Null-Magic Mantle adds 25 Magic Resist."
                    : "Cloth Armor adds 15 Armor.";

            message.textContent =
                `${explanation} ${champName} takes ${result.damage} ` +
                "damage and " +
                (result.remaining > 0
                    ? `survives with ${result.remaining} HP.`
                    : "does not survive.");

        } else if (inventory.includes("ruby")) {
            message.classList.add("caution");

            message.textContent =
                "Ruby Crystal adds 150 Health but does not " +
                `reduce ${result.enemy.type} damage. ` +
                `${champName} takes ${result.damage} damage and ` +
                (result.remaining > 0
                    ? `survives with ${result.remaining} HP.`
                    : "does not survive.");

        } else {
            message.textContent =
                result.enemy.type === "magic"
                    ? "Cloth Armor reduces physical damage, " +
                      `not magic. ${champName} still takes ` +
                      `${result.damage} damage and does not survive.`
                    : "Null-Magic Mantle reduces magic damage, " +
                      `not physical. ${champName} still takes ` +
                      `${result.damage} damage and does not survive.`;
        }

        feedback.append(message);
        root.append(feedback);

        root.append(
            el(
                "p",
                "muted study-note",
                "Practice values are from our group user-study " +
                "scenario, not current League of Legends patch statistics."
            )
        );
    }

    render();
    return setChampion;
}
