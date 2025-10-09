const LS_KEYS = {
    GENERATION: "tp20_generation",
    TYPE_FILTER: "tp20_typeFilter",
    SORT_CRITERION: "tp20_sortCriterion"
};

let currentPokemons = [];
let currentGeneration = 1;
let currentTypeFilter = "Tous";
let currentSortCriterion = "Nom";
let allTypesData = [];

function saveStateToLocalStorage() {
    try {
        localStorage.setItem(LS_KEYS.GENERATION, currentGeneration);
        localStorage.setItem(LS_KEYS.TYPE_FILTER, currentTypeFilter);
        localStorage.setItem(LS_KEYS.SORT_CRITERION, currentSortCriterion);
    } catch(e) {
        console.warn("LocalStorage non disponible :", e);
    }
}

function loadStateFromLocalStorage() {
    try {
        const gen = localStorage.getItem(LS_KEYS.GENERATION);
        if (gen) currentGeneration = Number(gen);

        const tf = localStorage.getItem(LS_KEYS.TYPE_FILTER);
        if (tf) currentTypeFilter = tf;

        const sc = localStorage.getItem(LS_KEYS.SORT_CRITERION);
        if (sc) currentSortCriterion = sc;
    } catch(e) {
        console.warn("LocalStorage non disponible :", e);
    }
}

function populateGenerations(maxGen = 8) {
    const sel = document.querySelector('#generations');
    if (!sel) return;
    sel.innerHTML = "";
    for (let i = 1; i <= maxGen; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Génération ${i}`;
        sel.appendChild(opt);
    }
    sel.value = currentGeneration;
}

function populateSortSelect() {
    const sel = document.querySelector('#sort');
    if (!sel) return;
    const options = [
        {value:"Nom", label:"Nom"},
        {value:"HP", label:"Points de vie"},
        {value:"attack", label:"Attaque"},
        {value:"defense", label:"Défense"},
        {value:"special_attack", label:"Attaque spéciale"},
        {value:"special_defense", label:"Défense spéciale"},
        {value:"speed", label:"Vitesse"},
        {value:"type", label:"Type (1er type)"}
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

async function loadTypes() {
    try {
        const res = await fetch('https://pokebuildapi.fr/api/v1/types');
        allTypesData = await res.json();
    } catch(e) {
        console.error("Erreur fetch types :", e);
        allTypesData = [];
    }
}

async function loaddata(generation) {
    currentGeneration = Number(generation);
    let pokemons = [];
    try {
        const res = await fetch(`https://pokebuildapi.fr/api/v1/pokemon/generation/${generation}`);
        pokemons = await res.json();
    } catch(e) {
        console.error(e);
        pokemons = [];
    }

    currentPokemons = pokemons;
    saveStateToLocalStorage();
    createTypeButtons();
    applyFilterSortAndRender();
}

function createTypeButtons() {
    const container = document.querySelector('#types-container');
    if (!container) return;
    container.innerHTML = "";

    const allBtn = document.createElement('button');
    allBtn.textContent = "Tous";
    allBtn.className = "type-btn";
    if(currentTypeFilter === "Tous") allBtn.classList.add('active');
    allBtn.addEventListener('click', () => {
        currentTypeFilter = "Tous";
        saveStateToLocalStorage();
        highlightActiveTypeButton();
        applyFilterSortAndRender();
    });
    container.appendChild(allBtn);

    allTypesData.forEach(t => {
        const btn = document.createElement('button');
        btn.className = "type-btn";
        btn.innerHTML = `<img src="${t.image}" alt="${t.name}" width="20" style="vertical-align:middle;margin-right:4px;">${t.name}`;
        if(currentTypeFilter === t.name) btn.classList.add('active');

        btn.addEventListener('click', () => {
            currentTypeFilter = t.name;
            saveStateToLocalStorage();
            highlightActiveTypeButton();
            applyFilterSortAndRender();
        });

        container.appendChild(btn);
    });
}

function highlightActiveTypeButton() {
    const btns = document.querySelectorAll('#types-container .type-btn');
    btns.forEach(b => {
        if(b.textContent.includes(currentTypeFilter)) b.classList.add('active');
        else b.classList.remove('active');
    });
}

function applyFilterSortAndRender() {
    let list = Array.from(currentPokemons);

    if(currentTypeFilter !== "Tous") {
        const lower = currentTypeFilter.toLowerCase();
        list = list.filter(p => Array.isArray(p.apiTypes) && p.apiTypes.some(t => t.name.toLowerCase() === lower));
    }

    list.sort((a,b) => comparePokemons(a,b,currentSortCriterion));
    renderPokemons(list);
}

function comparePokemons(a,b,criterion){
    if(criterion==="Nom") return a.name.localeCompare(b.name,'fr');
    if(criterion==="type"){
        const ta = a.apiTypes[0]?.name ?? "";
        const tb = b.apiTypes[0]?.name ?? "";
        return ta.localeCompare(tb,'fr') || a.name.localeCompare(b.name,'fr');
    }
    const statMap = {
        "HP": p => p.stats?.HP ?? 0,
        "attack": p => p.stats?.attack ?? 0,
        "defense": p => p.stats?.defense ?? 0,
        "special_attack": p => p.stats?.special_attack ?? 0,
        "special_defense": p => p.stats?.special_defense ?? 0,
        "speed": p => p.stats?.speed ?? 0
    };
    if(statMap[criterion]) return statMap[criterion](b) - statMap[criterion](a) || a.name.localeCompare(b.name,'fr');
    return 0;
}

function renderPokemons(list) {
    const main = document.querySelector('main');
    main.innerHTML = "";
    if(list.length === 0){
        main.innerHTML = "<p>Aucun Pokémon trouvé pour ces filtres.</p>";
        return;
    }

    list.forEach(p => {
        const article = document.createElement('article');
        const typeColor = p.apiTypes?.[0]?.name ? allTypesData.find(t=>t.name===p.apiTypes[0].name)?.color || 'grey' : 'grey';
        article.style.backgroundColor = typeColor;
        article.style.borderColor = typeColor;

        const typesText = Array.isArray(p.apiTypes) ? p.apiTypes.map(t=>t.name).join(" / ") : "";
        article.innerHTML = `
            <figure>
                <img src="${p.image}" alt="${p.name}">
                <figcaption>
                    <span class="types">${typesText}</span>
                    <h2>${p.name}</h2>
                    <ol>
                        <li>HP : ${p.stats?.HP ?? "—"}</li>
                        <li>Attaque : ${p.stats?.attack ?? "—"}</li>
                        <li>Défense : ${p.stats?.defense ?? "—"}</li>
                        <li>Attaque Spéciale : ${p.stats?.special_attack ?? "—"}</li>
                        <li>Défense Spéciale : ${p.stats?.special_defense ?? "—"}</li>
                        <li>Vitesse : ${p.stats?.speed ?? "—"}</li>
                    </ol>
                </figcaption>
            </figure>
        `;
        main.appendChild(article);
    });
}

async function initTP20() {
    loadStateFromLocalStorage();
    await loadTypes();
    populateGenerations();
    populateSortSelect();

    document.querySelector('#generations')?.addEventListener('change', e => loaddata(e.target.value));
    document.querySelector('#sort')?.addEventListener('change', e => {
        currentSortCriterion = e.target.value;
        saveStateToLocalStorage();
        applyFilterSortAndRender();
    });

    loaddata(currentGeneration);
}

document.addEventListener('DOMContentLoaded', initTP20);