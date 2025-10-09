const LS_KEYS = {
    ALL_TYPES: "tp20_allTypes",
    GENERATION: "tp20_generation",
    TYPE_FILTER: "tp20_typeFilter",
    SORT_CRITERION: "tp20_sortCriterion"
};

let currentPokemons = [];
let currentGeneration = 1;
let currentTypeFilter = "Tous";
let currentSortCriterion = "Nom";

const allTypesSet = new Set();
function saveStateToLocalStorage() {
    try {
        localStorage.setItem(LS_KEYS.GENERATION, String(currentGeneration));
        localStorage.setItem(LS_KEYS.TYPE_FILTER, currentTypeFilter);
        localStorage.setItem(LS_KEYS.SORT_CRITERION, currentSortCriterion);
        localStorage.setItem(LS_KEYS.ALL_TYPES, JSON.stringify(Array.from(allTypesSet)));
    } catch (e) {
        console.warn("LocalStorage non disponible :", e);
    }
}
function loadStateFromLocalStorage() {
    try {
        const gen = localStorage.getItem(LS_KEYS.GENERATION);
        if (gen !== null) currentGeneration = Number(gen) || 1;

        const tf = localStorage.getItem(LS_KEYS.TYPE_FILTER);
        if (tf !== null) currentTypeFilter = tf;

        const sc = localStorage.getItem(LS_KEYS.SORT_CRITERION);
        if (sc !== null) currentSortCriterion = sc;

        const at = localStorage.getItem(LS_KEYS.ALL_TYPES);
        if (at) {
            try {
                const arr = JSON.parse(at);
                if (Array.isArray(arr)) arr.forEach(t => allTypesSet.add(t));
            } catch (err) {
                console.warn("Erreur parsing allTypes dans localStorage", err);
            }
        }
    } catch (e) {
        console.warn("LocalStorage non disponible :", e);
    }
}
function populateGenerations(maxGen = 9) {
    const selGen = document.querySelector('select#generations');
    if (!selGen) return;
    selGen.innerHTML = "";
    for (let i = 1; i <= maxGen; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `Génération ${i}`;
        selGen.appendChild(opt);
    }
    selGen.value = currentGeneration;
}
function populateSortSelect() {
    const sel = document.querySelector('select#sort');
    if (!sel) return;
    const options = [
        { value: "Nom", label: "Nom" },
        { value: "HP", label: "Points de vie" },
        { value: "attack", label: "Attaque" },
        { value: "defense", label: "Défense" },
        { value: "special_attack", label: "Attaque spéciale" },
        { value: "special_defense", label: "Défense spéciale" },
        { value: "speed", label: "Vitesse" },
        { value: "type", label: "Type (ordre alphabétique du 1er type)" }
    ];
    sel.innerHTML = "";
    options.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        sel.appendChild(opt);
    });
    sel.value = currentSortCriterion;
}
async function loaddata(generation) {
    currentGeneration = Number(generation);
    let pokemons = [];
    try {
        const res = await fetch(`https://pokebuildapi.fr/api/v1/pokemon/generation/${generation}`);
        if (!res.ok) throw new Error('Erreur réseau');
        pokemons = await res.json();
    } catch (err) {
        console.error("Erreur fetch :", err);
        pokemons = [];
    }
    currentPokemons = pokemons;
    pokemons.forEach(p => {
        if (Array.isArray(p.apiTypes)) {
            p.apiTypes.forEach(t => {
                if (t && t.name) allTypesSet.add(t.name);
            });
        }
    });
    saveStateToLocalStorage();
    populateTypeSelect(pokemons);
    applyFilterSortAndRender();
}

function populateTypeSelect() {
    const sel = document.querySelector('#types');
    if (!sel) return;
    sel.innerHTML = "";

    const optAll = document.createElement('option');
    optAll.value = "Tous";
    optAll.textContent = "Tous les types";
    sel.appendChild(optAll);

    Array.from(allTypesSet).sort((a,b) => a.localeCompare(b,'fr')).forEach(typeName => {
        const opt = document.createElement('option');
        opt.value = typeName;
        opt.textContent = typeName;
        sel.appendChild(opt);
    });

    sel.value = currentTypeFilter;

    sel.addEventListener('change', (e) => {
        currentTypeFilter = e.target.value;
        saveStateToLocalStorage();
        applyFilterSortAndRender();
    });
}

function highlightActiveTypeButton() {
    const btns = document.querySelectorAll('#types-container .type-btn');
    btns.forEach(b => {
        if (b.textContent === currentTypeFilter) b.classList.add('active');
        else b.classList.remove('active');
    });
}

function applyFilterSortAndRender() {
    let list = Array.from(currentPokemons);
    if (currentTypeFilter && currentTypeFilter !== "Tous") {
        const lowerType = currentTypeFilter.toLowerCase();
        list = list.filter(p => Array.isArray(p.apiTypes) && p.apiTypes.some(t => t.name && t.name.toLowerCase() === lowerType));
    }
    list.sort((a, b) => comparePokemons(a, b, currentSortCriterion));
    renderPokemons(list);
}

function comparePokemons(a, b, criterion) {
    if (!criterion || criterion === "Nom") {
        return String(a.name).localeCompare(String(b.name), 'fr', { sensitivity: 'base' });
    }

    if (criterion === "type") {
        const ta = (Array.isArray(a.apiTypes) && a.apiTypes[0] && a.apiTypes[0].name) ? a.apiTypes[0].name : "";
        const tb = (Array.isArray(b.apiTypes) && b.apiTypes[0] && b.apiTypes[0].name) ? b.apiTypes[0].name : "";
        return String(ta).localeCompare(String(tb), 'fr', { sensitivity: 'base' }) || comparePokemons(a,b,"Nom");
    }

    const statMap = {
        "HP": p => p.stats?.HP ?? -Infinity,
        "attack": p => p.stats?.attack ?? -Infinity,
        "defense": p => p.stats?.defense ?? -Infinity,
        "special_attack": p => p.stats?.special_attack ?? -Infinity,
        "special_defense": p => p.stats?.special_defense ?? -Infinity,
        "speed": p => p.stats?.speed ?? -Infinity
    };

    if (statMap[criterion]) {
        const av = statMap[criterion](a);
        const bv = statMap[criterion](b);
        return (bv - av) || comparePokemons(a,b,"Nom"); 
    }

    return 0;
}

function renderPokemons(pokemonsList) {
    const main = document.querySelector('main');
    if (!main) return;
    main.innerHTML = "";

    pokemonsList.forEach(pokemon => {
        const article = document.createElement("article");

        let bgColor = "grey";
        const primaryType = (pokemon.apiTypes && pokemon.apiTypes[0] && pokemon.apiTypes[0].name) ? pokemon.apiTypes[0].name.toLowerCase() : "";
        switch (primaryType) {
            case "plante": bgColor = "#4dce1aff"; break;
            case "feu": bgColor = "#ff7f50"; break;
            case "eau": bgColor = "#1e90ff"; break;
            case "insecte": bgColor = "#9acd32"; break;
            case "normal": bgColor = "#d3d3d3"; break;
            case "électrik": case "electrik": bgColor = "#ffd700"; break;
            case "poison": bgColor = "#800080"; break;
            case "fée": case "fee": bgColor = "#ffb6c1"; break;
            case "combat": bgColor = "#ff4500"; break;
            case "psy": bgColor = "#dda0dd"; break;
            case "roche": bgColor = "#a9a9a9"; break;
            case "sol": bgColor = "#deb887"; break;
            case "glace": bgColor = "#add8e6"; break;
            case "dragon": bgColor = "#8a2be2"; break;
            case "spectre": bgColor = "#4b0082"; break;
            case "ténèbres": case "tenebres": bgColor = "#2f4f4f"; break;
            case "acier": bgColor = "#b0c4de"; break;
            case "vol": bgColor = "#87ceeb"; break;
            default: bgColor = "grey";
        }
        article.style.backgroundColor = bgColor;
        article.style.borderColor = bgColor;

        const types = Array.isArray(pokemon.apiTypes) ? pokemon.apiTypes.map(t => t.name).join(" / ") : "";
        article.setAttribute("data-types", types);

        article.innerHTML = `
          <figure>
            <picture>
              <img src="${pokemon.image}" alt="Image ${pokemon.name}">
            </picture>
            <figcaption>
              <span class="types">${types}</span>
              <h2>${pokemon.name}</h2>
              <ol>
                <li>Points de vie : ${pokemon.stats?.HP ?? "—"}</li>
                <li>Attaque : ${pokemon.stats?.attack ?? "—"}</li>
                <li>Défense : ${pokemon.stats?.defense ?? "—"}</li>
                <li>Attaque spécial : ${pokemon.stats?.special_attack ?? "—"}</li>
                <li>Défense spéciale : ${pokemon.stats?.special_defense ?? "—"}</li>
                <li>Vitesse : ${pokemon.stats?.speed ?? "—"}</li>
              </ol>
            </figcaption>
          </figure>
        `;
        main.appendChild(article);
    });

    if (pokemonsList.length === 0) {
        main.innerHTML = "<p>Aucun Pokémon trouvé pour ces filtres.</p>";
    }

 
    const counter = document.querySelector('#result-count');
    if (counter) counter.textContent = `Résultats : ${pokemonsList.length}`;
}

function initTP20() {

    loadStateFromLocalStorage();

    populateGenerations();
    populateSortSelect();

    const selGen = document.querySelector('select#generations');
    if (selGen) {
        selGen.addEventListener('change', (e) => {
            loaddata(e.target.value);
        });
    }

    const selSort = document.querySelector('select#sort');
    if (selSort) {
        selSort.addEventListener('change', (e) => {
            currentSortCriterion = e.target.value;
            saveStateToLocalStorage();
            applyFilterSortAndRender();
        });
    }

    loaddata(currentGeneration);
}

document.addEventListener('DOMContentLoaded', initTP20);
