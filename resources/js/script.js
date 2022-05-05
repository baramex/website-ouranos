const messages = {
    "Too Many Requests": "Trop de requêtes, veuillez réessayer dans quelques minutes."
};

function getMessage(error) {
    return messages[error?.data] || messages[error?.statusText] || "Erreur inattendue";
}

window.addEventListener("load", async () => {
    history.pushState("", document.title, window.location.pathname + window.location.search);

    var popup = localStorage.getItem("popup");
    if (popup) {
        localStorage.removeItem("popup");
        popup = JSON.parse(popup);
        if (popup.type == "success") showSuccess(popup.content);
        else if (popup.type == "error") showErrorMessage(popup.content);
    }

    var lastUpdate = sessionStorage.getItem("lastUpdate") || 0;
    if (new Date().getTime() - lastUpdate >= 5 * 60 * 1000) {
        await getUser();
        sessionStorage.setItem("lastUpdate", new Date().getTime());
    }
});

function disconnect() {
    if (!sessionStorage.getItem("token")) return;
    axios.post("/api/disconnect", {}, { headers: { Authorization: "token " + sessionStorage.getItem("token") } }).then(response => {
        localStorage.setItem("popup", JSON.stringify({ type: "success", content: "Déconnexion réussie !" }))
        window.location.href = "/";
    }, () => { });
    sessionStorage.clear();
}

async function getUser() {
    if (!sessionStorage.getItem("token")) return;
    await axios.get("/api/user", { headers: { Authorization: "token " + sessionStorage.getItem("token") } }).then(response => {
        sessionStorage.setItem("user", JSON.stringify(response.data.user));
    }, () => {
        sessionStorage.clear();
    });
    return;
}

function formatDate(date) {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")} ${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear().toString().padStart(4, "0")}`;
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