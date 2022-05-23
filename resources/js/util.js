window.addEventListener("load", async () => {
    history.pushState("", document.title, window.location.pathname + window.location.search);

    var popup = getCookie("popup");
    if (popup) {
        deleteCookie("popup");
        popup = JSON.parse(popup);
        if (popup.type == "success") showSuccess(getMessage(popup.content));
        else if (popup.type == "error") showErrorMessage(getMessage(popup.content));
    }

    var user = sessionStorage.getItem("user");
    var lastUpdate = sessionStorage.getItem("lastUpdate") || 0;
    if ((new Date().getTime() - lastUpdate >= 5 * 60 * 1000 || !user) && isAuthenticated()) {
        await getUser();
        user = sessionStorage.getItem("user");
        sessionStorage.setItem("lastUpdate", new Date().getTime());
    }
    if (user) {
        user = JSON.parse(user);
        var container = document.getElementById("account-container");
        container.querySelector(".login-btn").hidden = true;
        var acc = container.querySelector(".account-btn");
        // acc.querySelector("p.name").innerText = user.username;
        acc.querySelector("img.avatar").src = user.avatar_url;
        acc.hidden = false;
    }
});

const messages = {
    TooManyRequests: "Trop de requêtes, veuillez réessayer dans quelques minutes.",
    Logged: "Connexion réussie !",
    Logout: "Déconnexion réussie !",
    NotInTheServer: "Vous devez être dans notre serveur discord.",
    Unexpected: "Erreur inattendue.",
    Unauthorized: "Vous n'êtes pas autorisé à faire ça.",
    InvalidSession: "Session invalide, veuillez vous reconnecter."
};

function getMessage(error) {
    if (!error) error = "message:unexpected";
    var txt = error.data || error.statusText || error;
    if (!txt || !txt.startsWith("message:")) return txt || "Erreur inattendue";
    txt = txt.replace(/ /g, "").replace("message:", "");

    return messages[txt] || txt;
}

function isAuthenticated() {
    return getCookie("token") && getCookie("sessionID") && getCookie("userID");
}

function resetSession() {
    deleteCookie("token");
    deleteCookie("sessionID");
    deleteCookie("userID");
    sessionStorage.clear();
}

function deleteCookie(name) {
    if (getCookie(name)) setCookie(name, "", -1);
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
    axios.post("/api/disconnect").then(() => {
        setCookie("popup", JSON.stringify({ type: "success", content: getMessage("message:Logout") }))
        window.location.href = "/";
    }, () => {
        showErrorMessage(getMessage());
    });
    resetSession();
}

async function getUser() {
    await axios.get("/api/user/partial", { params: { projection: "username,avatar_url" } }).then(response => {
        var user = JSON.parse(sessionStorage.getItem("user") || "{}") || {};
        sessionStorage.setItem("user", JSON.stringify({ ...user, ...response.data }));
    }, err => {
        if (err.response.status == 401) {
            showErrorMessage(getMessage("message:InvalidSession"));
            resetSession();
        }
    });
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