const target = document.getElementById("target");
const context = document.getElementById("context");
const searchButton = document.getElementById("searchButton");
const resultCounter = document.getElementById("resultCounter");
const offers = document.getElementById("offers");

class Offer {
  constructor(offer) {
    Object.assign(this, offer);
  }
}

// const baseUrl = 'http://localhost:5678/webhook-test/alternance';
// const headers = new Headers({
//     token: token,
//     client_id: client_id,
//     client_secret: client_secret
// });
// const params = new URLSearchParams({
//     target: target.value,
//     context: context.value,
//     target_diploma_level: 6
// });
// const requestOptions = {method: "POST", headers: headers, body: "", redirect: "follow"};

// fetch(`${baseUrl}?${params}`, requestOptions)
// .then((response) => response.json())
// .then((result) => parseOffers(result["data"]))
// .catch((error) => console.error(error));

var currentOffers = []

async function fetchOffers() {
    searchButton.disabled = true;

    const baseUrl = 'http://localhost:5678/webhook/alternance';
    const headers = new Headers({
        token: token,
        client_id: client_id,
        client_secret: client_secret
    });
    const params = new URLSearchParams({
        target: target.value,
        context: context.value,
        target_diploma_level: 6
    });
    const requestOptions = {method: "POST", headers: headers, body: "", redirect: "follow"};

    await fetch(`${baseUrl}?${params}`, requestOptions)
    .then((response) => response.json())
    .then((result) => parseOffers(result["data"]))
    .catch((error) => console.error(error));

    searchButton.disabled = false;
}

function parseOffers(data) {
    currentOffers = [];
    for (const item in data) {
        const offer = new Offer(data[item]) 
        if (new Date(offer.publication.expiration) < new Date()) {
            continue;
        }
        currentOffers.push(offer);
    }
    resultCounter.textContent = `${currentOffers.length} offres`;
    currentOffers.sort((b, a) => {
        return new Date(a.contract.start) - new Date(b.contract.start);
    });

    offers.innerHTML = "";
    for (const offer of currentOffers) {
        displayOffer(offer);
    }
}

function parseDate(date) {
    return new Date(date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function cleanDescription(html) {
    if (!html) return "";
    
    const temp = document.createElement("div");
    temp.innerHTML = html;
    temp.querySelectorAll("script, style").forEach(el => el.remove());
    temp.querySelectorAll("li").forEach(li => {
        const text = li.textContent;
        const p = document.createElement("p");
        p.textContent = "• " + text;
        li.replaceWith(p);
    });
    temp.querySelectorAll("ul, ol").forEach(list => {
        while (list.firstChild) {
            list.parentNode.insertBefore(list.firstChild, list);
        }
        list.remove();
    });
    let cleaned = temp.innerHTML;
    cleaned = cleaned.replace(/<\/[^>]+>/g, (match) => {
        const tag = match.match(/<\/(\w+)>/)?.[1];
        if (tag && !cleaned.includes(`<${tag}`)) {
            return "";
        }
        return match;
    });
    
    return cleaned;
}

function displayOffer(offer) {
    const card = document.createElement("div");
    card.className = "card";
    const phone_nb = offer.workplace.phone;
    const phone_display = phone_nb ? phone_nb.replace(new RegExp(`.{2}`, 'g'), '$&' + ' ').slice(0, -1) : "";
    const conditions = offer.access.conditions ?? offer.access.label

    card.innerHTML = `
        <h2><a target="_blank" href="${offer.url}">${offer.info.title}</a></h2>
        <div class="info">
            <p><i class="ph ph-map-pin"></i><a target="_blank" href="https://www.google.com/maps/search/?api=1&query=${offer.workplace.address}">${offer.workplace.name ?? "UNKNOWN"} - ${offer.workplace.address}</a></p>
            ${phone_nb ? `<p><i class="ph ph-phone"></i><a target="_blank" href="tel:+${phone_nb}">${phone_display}</a></p>` : ""}
            ${conditions ? `<p><i class="ph ph-graduation-cap"></i>${conditions ?? ""}</p>` : ""}
            <p><i class="ph ph-calendar-dots"></i>Commence le ${parseDate(offer.contract.start)} (${offer.contract.duration} mois) - Expire le ${parseDate(offer.publication.expiration)}</p>
        </div>
        <p class="desc">${cleanDescription(offer.info.description)}</p>`;
    offers.appendChild(card);

}