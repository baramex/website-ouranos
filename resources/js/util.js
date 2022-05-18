window.addEventListener("load", async () => {
    history.pushState("", document.title, window.location.pathname + window.location.search);

    var popup = getCookie("popup");
    if (popup) {
        deleteCookie("popup");
        popup = JSON.parse(popup);
        if (popup.type == "success") showSuccess(getMessage(popup.content));
        else if (popup.type == "error") showErrorMessage(getMessage(popup.content));
    }

    var lastUpdate = sessionStorage.getItem("lastUpdate") || 0;
    if (new Date().getTime() - lastUpdate >= 5 * 60 * 1000 && sessionStorage.getItem("token")) {
        await getUser();
        sessionStorage.setItem("lastUpdate", new Date().getTime());
    }
});

const messages = {
    TooManyRequests: "Trop de requêtes, veuillez réessayer dans quelques minutes.",
    Logged: "Connexion réussie !",
    Logout: "Déconnexion réussie !",
    NotOnTheServer: "Vous devez être sur notre serveur discord.",
    Unexpected: "Erreur inattendue",
    Unauthorized: "Vous n'êtes pas autorisé à faire ça."
};

function getMessage(error) {
    if (!error) error = "message:unexpected";
    var txt = error.data || error.statusText || error;
    if (!txt || !txt.startsWith("message:")) return txt || "Erreur inattendue";
    txt = txt.replace(/ /g, "").replace("message:", "");

    return messages[txt] || txt;
}

function resetSession() {
    deleteCookie("token");
    deleteCookie("sessionID");
    deleteCookie("discordID");
    sessionStorage.clear();
}

function deleteCookie(name) {
    setCookie(name, "", -1);
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(name) {
    var cookies = parseCookies(document.cookie);
    return cookies[name];
}

function parseCookies(str) {
    return str.split(';').map(v => v.split('=')).reduce((acc, v) => { acc[decodeURIComponent(v[0]?.trim())] = decodeURIComponent(v[1]?.trim()); return acc; }, {});
}

function formatDate(date) {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")} ${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear().toString().padStart(4, "0")}`;
}

function disconnect() {
    var token = getCookie("token");
    if (!token) return;
    axios.post("/api/disconnect", {}, { headers: { Authorization: "Token " + token } }).then(response => {
        setCookie("popup", JSON.stringify({ type: "success", content: getMessage("message:Logout") }))
        window.location.href = "/";
    }, () => { });
    resetSession();
}

async function getUser() {
    var token = getCookie("token");
    if (!token) return;
    await axios.get("/api/user", { headers: { Authorization: "Token " + token } }).then(response => {
        sessionStorage.setItem("user", JSON.stringify(response.data.user));
    }, () => {
        resetSession();
    });
    return;
}

function showErrorMessage(error, action = null) {
    openPopup("popup-error");
    var popup = document.getElementById("popup-error");
    popup.querySelector("p.text").innerText = error;

    document.getElementById("valid-error").onclick = () => {
        if (action) action();
        closePopup("popup-error");
    };
}

function showSuccess(message, action = null) {
    openPopup("popup-success");
    var popup = document.getElementById("popup-success");
    popup.querySelector("p.text").innerText = message;

    document.getElementById("valid-success").onclick = () => {
        if (action) action();
        closePopup("popup-success");
    };
}

function closePopup(id, hidden = true) {
    var popup = document.getElementById(id);
    if (!popup) return;
    popup.style.transform = "translate(-50%, -50%) scale(0)";

    setTimeout(() => popup.style.display = "none", 300);

    if (hidden) {
        var hidden = document.getElementById("hidden-tab");
        hidden.style.opacity = "0";
        setTimeout(() => hidden.style.display = "none", 300);
    }
}

function openPopup(id) {
    var popup = document.getElementById(id);
    if (!popup) return;

    popup.style.display = "block";
    setTimeout(() => popup.style.transform = "translate(-50%, -50%) scale(1)", 50);

    var hidden = document.getElementById("hidden-tab");
    hidden.style.display = "block";
    setTimeout(() => hidden.style.opacity = "1", 50);
}

window.addEventListener("scroll", () => {
    var header = document.querySelector("header#main-header");
    header?.classList.toggle("banner", window.scrollY > 0)
});