class Type {
    constructor(name, image = "", color = "") {
        this.name = name;
        this.image = image;
        this.color = color || this.getColorHexa();
    }

    getColorHexa() {
        switch (this.name.toLowerCase()) {
            case "plante": return "#4dce1aff";
            case "feu": return "#ff7f50";
            case "eau": return "#1e90ff";
            case "insecte": return "#9acd32";
            case "normal": return "#d3d3d3";
            case "électrik": case "electrik": return "#ffd700";
            case "poison": return "#800080";
            case "fée": case "fee": return "#ffb6c1";
            case "combat": return "#ff4500";
            case "psy": return "#dda0dd";
            case "roche": return "#a9a9a9";
            case "sol": return "#deb887";
            case "glace": return "#add8e6";
            case "dragon": return "#8a2be2";
            case "spectre": return "#4b0082";
            case "ténèbres": case "tenebres": return "#2f4f4f";
            case "acier": return "#b0c4de";
            case "vol": return "#87ceeb";
            default: return "grey";
        }
    }
}

class Pokemon {
    constructor(data) {
        this.id = data.id;
        this.image = data.image;
        this.name = data.name;
        this.apiTypes = data.apiTypes.map(t => new Type(t.name, t.image));
        this.stats = data.stats || {};
    }

    displayCard() {
        const article = document.createElement("article");
        const primaryType = this.apiTypes[0]?.name || "";
        article.style.backgroundColor = this.apiTypes[0]?.color || "grey";
        article.style.borderColor = article.style.backgroundColor;
        article.innerHTML = `
          <figure>
            <picture>
              <img src="${this.image}" alt="Image ${this.name}">
            </picture>
            <figcaption>
              <span class="types">${this.apiTypes.map(t => t.name).join(" / ")}</span>
              <h2>${this.name}</h2>
              <ol>
                <li>Points de vie : ${this.stats.HP ?? "—"}</li>
                <li>Attaque : ${this.stats.attack ?? "—"}</li>
                <li>Défense : ${this.stats.defense ?? "—"}</li>
                <li>Attaque spécial : ${this.stats.special_attack ?? "—"}</li>
                <li>Défense spéciale : ${this.stats.special_defense ?? "—"}</li>
                <li>Vitesse : ${this.stats.speed ?? "—"}</li>
              </ol>
            </figcaption>
          </figure>
        `;
        return article;
    }
}
async function loadPokemons(generation = 1) {
    const main = document.querySelector("main");
    main.innerHTML = "";
    let data = [];
    try {
        const res = await fetch(`https://pokebuildapi.fr/api/v1/pokemon/generation/${generation}`);
        data = await res.json();
    } catch (err) {
        console.error(err);
        return;
    }

    const pokemons = data.map(d => new Pokemon(d));
    pokemons.forEach(p => main.appendChild(p.displayCard()));
}
loadPokemons(1);

