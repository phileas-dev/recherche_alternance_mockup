const target = document.getElementById("target");
const context = document.getElementById("context");
const searchButton = document.getElementById("searchButton");
const resultCounter = document.getElementById("resultCounter");
const offers = document.getElementById("offers");

const STORAGE_KEY = 'alternance_offers';

class Offer {
  constructor(offer) {
    Object.assign(this, offer);
    if (offer.visited === undefined || offer.visited === null) {
      this.visited = false;
    }
  }
}

var currentOffers = [];


function loadOffersFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            currentOffers = data.map(o => {
                const offer = new Offer(o);
                offer.visited = o.visited || false;
                return offer;
            });
            renderOffers();
            console.log(`Loaded ${currentOffers.length} offers from storage`);
        }
    } catch (e) {
        console.error("Failed to load offers from storage:", e);
    }
}

function saveOffersToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOffers));
    } catch (e) {
        console.error("Failed to save offers to storage:", e);
    }
}

function markOfferVisited(url) {
    const offer = currentOffers.find(o => o.url === url);
    if (offer) {
        offer.visited = true;
        saveOffersToStorage();
    }
}

loadOffersFromStorage();

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
    .then((response) => {
        if (!response.ok) {throw new Error(`HTTP error: ${response.status}`);}
        return response.text();
    })
    .then((text) => {
        if (!text) {throw new Error("Empty response");}
        const bytes = new TextEncoder().encode(text).length / 1_000_000;
        console.log("Response size:", bytes.toFixed(2), "MB");
        const result = JSON.parse(text);
        parseOffers(result["data"]);
    })
    .catch((error) => {
        console.error("Fetch error:", error);
        alert("Error: " + error.message);
    });

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
    currentOffers.sort((b, a) => {
        return new Date(a.contract.start) - new Date(b.contract.start);
    });

    saveOffersToStorage();
    renderOffers();
}

function renderOffers() {
    resultCounter.textContent = `${currentOffers.length} offres`;
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

function getRelativeTime(dateStr) {
    const now = new Date();
    const target = new Date(dateStr);

    const diffMs = target - now;
    if (diffMs <= 0) {return "Expirée";}

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 30) {return `${diffDays} jour${diffDays !== 1 ? 's' : ''}`;}
    
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    if (remainingDays === 0) {return `${months} mois`;}
    
    return `${months} mois ${remainingDays} jour${remainingDays !== 1 ? 's' : ''}`;
}

function displayOffer(offer) {
    const card = document.createElement("div");
    card.className = "card" + (offer.visited ? " visited" : "");
    const phone_nb = offer.workplace.phone;
    const phone_display = phone_nb ? phone_nb.replace(new RegExp(`.{2}`, 'g'), '$&' + ' ').slice(0, -1) : "";
    const conditions = (offer.access?.conditions?.length > 0) ? offer.access.conditions.join(", ") : (offer.access?.label ?? "");

    card.innerHTML = `
        <h2 class="title"><a target="_blank" href="${offer.url}">${offer.info.title}</a></h2>
        <div class="info">
        <p class="dates"><i class="ph ph-calendar-dots"></i><b>${parseDate(offer.contract.start)}</b> (${offer.contract.duration} mois)</p>
        <p class="workplace"><i class="ph ph-map-pin"></i><a target="_blank" href="https://www.google.com/maps/search/?api=1&query=${offer.workplace.address}">${offer.workplace.name ?? "UNKNOWN"} - ${offer.workplace.address}</a></p>
            ${phone_nb ? `<p class="phone"><i class="ph ph-phone"></i><a target="_blank" href="tel:+${phone_nb}">${phone_display}</a></p>` : ""}
            ${conditions ? `<p class="conditions"><i class="ph ph-graduation-cap"></i>${conditions ?? ""}</p>` : ""}
        </div>
        <p class="expiry"><i class="ph ph-hourglass-low"></i>${getRelativeTime(offer.publication.expiration)}</p>`;
    offers.appendChild(card);
    
    const titleLink = card.querySelector('.title a');
    titleLink.addEventListener('click', () => {
        markOfferVisited(offer.url);
        card.classList.add('visited');
    });
    
    const title = card.querySelector('.title');
    const maxHeight = 70;
    let fontSize = 24;
    title.style.fontSize = fontSize + 'px';
    while (title.scrollHeight > maxHeight && fontSize > 10) {
        fontSize--;
        title.style.fontSize = fontSize + 'px';
    }
}