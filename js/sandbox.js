
const START_GOLD = 750;
const REFERENCE = {
    health: 690,
    armor: 38,
    magicResist: 32
};

export function initSandbox(root, items, scenarios) {
    const itemById = Object.fromEntries(
        items.map(item => [item.id, item])
    );

    const scenarioById = Object.fromEntries(
        scenarios.map(s => [s.id, s])
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
        render();
    }

    function calculate() {
        const base = scenarioById[currentChampion.id];
        const enemy = scenarios[enemyIndex];

        const equipped = inventory
            .filter(Boolean)
            .map(id => itemById[id]);

        const total = field =>
            equipped.reduce(
                (sum, item) => sum + item[field],
                0
            );

        const spent = total("cost");
        const health = base.health + total("health");
        const armor = base.armor + total("armor");
        const magicResist = base.magicResist + total("magicResist");

        const resistanceKey = enemy.type === "magic"
            ? "magicResist"
            : "armor";

        const resistance = enemy.type === "magic"
            ? magicResist
            : armor;

        const normalizedRaw =
            enemy.rawDamage *
            (base.health / REFERENCE.health) *
            ((100 + base[resistanceKey]) /
             (100 + REFERENCE[resistanceKey]));

        const damage = Math.round(
            normalizedRaw * 100 / (100 + resistance)
        );

        const remaining = Math.max(0, health - damage);

        const countered = equipped.some(
            item => item[resistanceKey] > 0
        );

        const boostedHealth = equipped.some(
            item => item.health > 0
        );

        return {
            base,
            enemy,
            equipped,
            health,
            armor,
            magicResist,
            spent,
            gold: START_GOLD - spent,
            normalizedRaw,
            damage,
            remaining,
            countered,
            boostedHealth,
            resistanceKey
        };
    }

    function el(tag, className = "", value) {
        const node = document.createElement(tag);

        if (className) {
            node.className = className;
        }

        if (value !== undefined) {
            node.textContent = value;
        }

        return node;
    }

    function section(name) {
        const box = el("section", "sandbox-panel");
        box.append(el("h3", "", name));
        return box;
    }

    function selectEnemy(index) {
        enemyIndex = index;
        pendingItem = null;
        notice = "";
        render();
    }

    function remove(slot) {
        inventory[slot] = null;
        pendingItem = null;
        notice = "Item removed; gold refunded.";
        render();
    }

    function equip(id, slot) {
        if (!itemById[id] || slot < 0 || slot >= inventory.length) {
            return;
        }

        const next = [...inventory];
        const oldSlot = next.indexOf(id);

        if (oldSlot !== -1) {
            next[oldSlot] = null;
        }

        next[slot] = id;

        const cost = next.reduce((sum, itemId) => {
            return sum + (itemId ? itemById[itemId].cost : 0);
        }, 0);

        if (cost > START_GOLD) {
            notice =
                `Not enough gold. ${itemById[id].name} costs ` +
                `${itemById[id].cost} gold. You have ` +
                `${calculate().gold} gold left; this combination ` +
                `costs ${cost}.`;
        } else {
            inventory = next;
            notice = "";
        }

        pendingItem = null;
        render();
    }

    function render() {
        if (!currentChampion) {
            root.textContent = "Choose a champion to begin.";
            return;
        }

        if (!scenarioById[currentChampion.id]) {
            root.textContent =
                "No practice statistics are available for this champion.";
            return;
        }

        const r = calculate();
        const playerName = currentChampion.name;

        const title = document.getElementById("sandbox-intro-title");
        const description = document.getElementById("sandbox-intro-desc");

        if (title) {
            title.textContent =
                `Practice Scenario: ${playerName} vs ${r.enemy.name}`;
        }

        if (description) {
            description.textContent =
                `Playing as ${playerName}. Defend against ` +
                `${r.enemy.name}'s ${r.enemy.type} practice attack ` +
                `using defensive items.`;
        }

        root.replaceChildren();

        const bar = el("div", "sandbox-topbar");
        const badge = el("div", "sandbox-player-badge");

        const playerImage = el("img", "sandbox-player-img");
        playerImage.src = `assets/images/${currentChampion.id}.jpg`;
        playerImage.alt = `${playerName} portrait`;

        badge.append(
            playerImage,
            el(
                "span",
                "",
                `PLAYING AS ${playerName.toUpperCase()} · ` +
                `VS ${r.enemy.name.toUpperCase()} · LEVEL 1`
            )
        );

        const reset = el("button", "", "Reset Scenario");
        reset.type = "button";

        reset.addEventListener("click", () => {
            inventory = [null, null, null];
            enemyIndex = 0;
            pendingItem = null;
            notice = "Scenario reset.";
            render();
        });

        bar.append(badge, reset);
        root.append(bar);

        const threat = section("Incoming Threat");
        const enemyHeader = el("div", "enemy-header");

        const portrait = el("img", "enemy-portrait");
        portrait.src = `assets/images/${r.enemy.id}.jpg`;
        portrait.alt = `${r.enemy.name} portrait`;

        const enemyText = el("div", "enemy-labels");

        enemyText.append(
            el("h4", "", `${r.enemy.name} — ${r.enemy.role}`)
        );

        const term = el(
            "button",
            "jargon-term",
            `${r.enemy.type} damage`
        );

        term.type = "button";
        term.setAttribute("aria-expanded", "false");

        const tooltip = el(
            "span",
            "inline-tooltip",
            r.enemy.type === "magic"
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

        const controls = el("div", "enemy-controls");

        const label = el(
            "label",
            "enemy-select-label",
            "Choose opponent"
        );

        label.htmlFor = "enemy-picker";

        const picker = el("select", "enemy-select");
        picker.id = "enemy-picker";

        for (const scenario of scenarios) {
            const option = el("option", "", scenario.name);
            option.value = scenario.id;
            picker.append(option);
        }

        picker.value = r.enemy.id;

        picker.addEventListener("change", () => {
            const index = scenarios.findIndex(
                s => s.id === picker.value
            );

            if (index !== -1) {
                selectEnemy(index);
            }
        });

        const switchButton = el("button", "", "Switch Enemy");
        switchButton.type = "button";

        switchButton.addEventListener("click", () => {
            selectEnemy((enemyIndex + 1) % scenarios.length);
        });

        controls.append(label, picker, switchButton);
        enemyHeader.append(portrait, enemyText, controls);
        threat.append(enemyHeader);

        threat.append(
            el(
                "p",
                "",
                `${r.enemy.name}: ${r.damage} ${r.enemy.type} ` +
                `damage incoming · ${playerName} has ${r.health} HP`
            )
        );

        const track = el("div", "threat-track");

        const gauge = el(
            "div",
            "threat-fill" + (r.remaining > 0 ? " safe" : "")
        );

        gauge.style.width =
            `${Math.min(100, r.damage / r.health * 100)}%`;

        track.append(gauge);

        threat.append(
            track,
            el(
                "strong",
                "threat-status",
                r.remaining > 0
                    ? `${playerName} survives with ${r.remaining} HP`
                    : `${playerName} would be defeated (${r.remaining} HP)`
            )
        );

        root.append(threat);

        const slots = section("Active Inventory");

        slots.append(
            el(
                "p",
                "muted",
                `Gold remaining: ${r.gold} / ${START_GOLD}. ` +
                "Click an item, then a slot, or drag an item onto a slot."
            )
        );

        const grid = el("div", "inventory-grid");

        inventory.forEach((id, index) => {
            const item = id ? itemById[id] : null;

            const slot = el(
                "button",
                "inventory-slot",
                item
                    ? `${item.name}\nClick to remove`
                    : `Slot ${index + 1}\nDrop item here`
            );

            slot.type = "button";
            slot.dataset.slot = String(index);

            if (item) {
                slot.draggable = true;
                slot.classList.add("filled");

                slot.classList.add(
                    item[r.resistanceKey] > 0
                        ? "counter"
                        : item.health > 0
                            ? "health-item"
                            : "ineffective"
                );

                slot.addEventListener("dragstart", event => {
                    event.dataTransfer.setData("text/plain", id);
                    event.dataTransfer.effectAllowed = "move";
                });
            }

            slot.addEventListener("click", () => {
                if (pendingItem) {
                    equip(pendingItem, index);
                } else if (item) {
                    remove(index);
                }
            });

            slot.addEventListener("dragover", event => {
                event.preventDefault();
            });

            slot.addEventListener("drop", event => {
                event.preventDefault();

                equip(
                    event.dataTransfer.getData("text/plain"),
                    index
                );
            });

            grid.append(slot);
        });

        slots.append(grid);

        slots.append(
            el(
                "p",
                "muted",
                "Item border guide: Green = reduces incoming damage. " +
                "Yellow = adds health without reducing damage. " +
                "Red = does not reduce this damage type."
            )
        );


        slots.append(
            el(
                "p",
                "muted",
                `Health: ${r.health} · Armor: ${r.armor} · ` +
                `Magic Resist: ${r.magicResist} · ` +
                `Remaining HP: ${r.remaining}`
            )
        );

        root.append(slots);

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

            card.setAttribute(
                "aria-pressed",
                String(pendingItem === item.id)
            );

            card.append(
                el("strong", "", item.name),
                el("span", "", `${item.description} · ${item.cost} Gold`),
                el(
                    "small",
                    "",
                    equipped
                        ? "Equipped — click its slot to remove"
                        : "Click or drag to equip"
                )
            );

            card.addEventListener("click", () => {
                if (equipped) {
                    notice =
                        `Already equipped: ${item.name}. ` +
                        "Click its slot to remove it.";
                } else {
                    pendingItem =
                        pendingItem === item.id ? null : item.id;

                    notice = pendingItem
                        ? `Choose a slot for ${item.name}.`
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

            const index = inventory.indexOf(
                event.dataTransfer.getData("text/plain")
            );

            if (index !== -1) {
                remove(index);
            }
        });

        root.append(bench);

        const feedback = section("Combat Feedback");
        const message = el("div", "combat-message");

        const outcome = r.remaining > 0
            ? `${playerName} survives with ${r.remaining} HP.`
            : `${playerName} does not survive (${r.remaining} HP).`;

        if (notice) {
            message.textContent = notice;

            if (notice.startsWith("Not enough gold")) {
                message.classList.add("caution");
            }
        } else if (r.equipped.length === 0) {
            message.textContent =
                `${r.enemy.name} deals ${r.enemy.type} practice damage. ` +
                `Equip defensive items to see whether ${playerName} survives.`;
        } else {
            const phrases = [];

            if (r.countered) {
                phrases.push(
                    r.enemy.type === "magic"
                        ? "Magic Resist reduces the incoming magic damage."
                        : "Armor reduces the incoming physical damage."
                );
            }

            if (r.boostedHealth) {
                phrases.push(
                    "Ruby Crystal increases health without reducing " +
                    "the incoming damage."
                );
            }

            if (!r.countered && !r.boostedHealth) {
                phrases.push(
                    r.enemy.type === "magic"
                        ? "Armor does not reduce this magic damage."
                        : "Magic Resist does not reduce this physical damage."
                );
            }

            message.textContent =
                `${phrases.join(" ")} ${outcome}`;

            if (r.countered) {
                message.classList.add("success");
            } else if (r.boostedHealth) {
                message.classList.add("caution");
            }
        }

        message.setAttribute("role", "status");
        message.setAttribute("aria-live", "polite");

        feedback.append(message);
        root.append(feedback);

        const details = el("details", "calculation-details");

        details.append(
            el("summary", "", "How is damage calculated?")
        );

        details.append(
            el(
                "p",
                "",
                `Training hit: ${Math.round(r.normalizedRaw)} raw damage. ` +
                "Damage after resistance = raw damage × 100 / " +
                "(100 + relevant resistance). " +
                `Health after hit = max(0, ${r.health} − ${r.damage}) = ` +
                `${r.remaining}.`
            )
        );

        root.append(details);

        root.append(
            el(
                "p",
                "muted study-note",
                "Practice-only attack: each opponent uses a 1,000 " +
                "raw-damage benchmark against Garen, scaled to the " +
                "selected champion's starting health and defenses. " +
                "This does not represent live-patch ability damage."
            )
        );
    }

    render();
    return setChampion;
}
