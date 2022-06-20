fetch("/static/header.html").then(res => res.text()).then(txt => document.getElementById("header").innerHTML = txt);

var __body;
var barHeader;
var headerSize;
window.addEventListener("load", async () => {
    __body = true;

    // remove #
    history.pushState("", document.title, window.location.pathname + window.location.search);

    // update header banner
    barHeader = document.body.querySelector("header#main-header");
    headerSize = document.getElementById("main").clientHeight - 320 - 80;
    scrollUpdate();

    // show popup
    var popup = getCookie("popup");
    if (popup) {
        deleteCookie("popup");
        popup = JSON.parse(popup);
        if (popup.type == "success") showSuccess(getMessage(popup.content));
        else if (popup.type == "error") showErrorMessage(getMessage(popup.content));
    }

    // navigate
    var navigate = document.getElementById("navigate");
    var path = document.location.pathname;
    if (path != "/") {
        var a = document.createElement("a");
        a.innerText = "accueil";
        a.href = "/";

        var span = document.createElement("span");
        span.innerText = document.title.split("|")[1]?.trim() || path.split("/").reverse()[0];

        var separator = document.createElement("span");
        separator.innerText = " / ";

        navigate.append(a, separator, span);

        navigate.hidden = false;
    }
});

function userFetched(type) {
    if (!__body) return setTimeout(() => userFetched(type), 10);
    var user = sessionStorage.getItem("user");
    if (user) {
        user = JSON.parse(user);
        document.getElementById("btn-login").hidden = true;

        var acc = document.getElementById("btn-account");
        acc.hidden = false;

        var names = document.body.getElementsByClassName("name");
        if (names.length > 0)
            for (const i in names) {
                names.item(i).innerText = user.username;
            }
        var avatars = document.body.getElementsByClassName("avatar");
        if (avatars.length > 0)
            for (const i in avatars) {
                avatars.item(i).src = user.avatar_url + (avatars.item(i).classList.contains("large") ? "?size=480" : "");
            }

        if (type == "complete") {
            var tags = document.body.getElementsByClassName("tag");
            if (tags.length > 0)
                for (const i in tags) {
                    tags.item(i).innerText = user.username + "#" + user.discriminator;
                }
            var emails = document.body.getElementsByClassName("email");
            if (emails.length > 0)
                for (const i in emails) {
                    emails.item(i).innerText = user.email;
                }
            var lvlt = document.body.getElementsByClassName("level-txt");
            if (lvlt.length > 0)
                for (const i in lvlt) {
                    lvlt.item(i).innerText = "Niveau " + (user.lvl || 1);
                }
            var lvlv = document.body.getElementsByClassName("level-val");
            if (lvlv.length > 0)
                for (const i in lvlv) {
                    lvlv.item(i).setAttribute("ariaValuenow", user.exp || 0);
                    lvlv.item(i).setAttribute("ariaValuemax", maxExp(user.lvl || 1));
                    lvlv.item(i).style.width = (100 * user.exp / maxExp(user.lvl || 1)) + "%";
                }
            var grades = document.body.getElementsByClassName("grades");
            if (grades.length > 0)
                for (const i in grades) {
                    grades.item(i).innerText = user.grades?.map(a => a.name.toLowerCase()).join(", ") || "aucun";
                }
            var from = document.body.getElementsByClassName("from");
            if (from.length > 0)
                for (const i in from) {
                    var date = new Date(user.date);
                    from.item(i).innerText = `le ${String(date.getDate()).padStart(2, "0")}/${String(date.getDay()).padStart(2, "0")}/${date.getFullYear()}`;
                }
            var warns = document.body.getElementsByClassName("warns");
            if (warns.length > 0)
                for (const i in warns) {
                    warns.item(i).innerText = user.infractions?.warns + " avertissement";
                }
            var bans = document.body.getElementsByClassName("bans");
            if (bans.length > 0)
                for (const i in bans) {
                    bans.item(i).innerText = user.infractions?.bans + " bannissement";
                }
            var mutes = document.body.getElementsByClassName("mutes");
            if (mutes.length > 0)
                for (const i in mutes) {
                    mutes.item(i).innerText = user.infractions?.mutes + " mutes";
                }
            var kicks = document.body.getElementsByClassName("kicks");
            if (kicks.length > 0)
                for (const i in kicks) {
                    kicks.item(i).innerText = user.infractions?.kicks + " expulsions";
                }
            var advices = document.body.getElementsByClassName("advices");
            if (advices.length > 0)
                for (const i in advices) {
                    user.staff_advices.forEach(advice => {
                        // TODO
                        var div = document.createElement("div");
                        div.innerText = advice.comment;
                        advices.item(i).append(div);
                    });
                }
        }
    }

    // remove loader
    var preloader = document.getElementById("preloader");
    preloader.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = () => preloader.remove();
}

function maxExp(level) {
    return ((level * 100 + level * 30) * (Math.round(level / 5) + 1));
}

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

function showCatchMessage(err) {
    showErrorMessage(getMessage("message:" + err));
}

async function disconnect() {
    await axios.post("/api/disconnect").then(() => {
        setCookie("popup", JSON.stringify({ type: "success", content: getMessage("message:Logout") }));
        resetSession();
        window.location.href = "/";
    }, showCatchMessage);
}

async function getUser(type = "partial", projection = "username,avatar_url") {
    var res = await axios.get("/api/user/@me/" + type, { params: { projection } }).catch(showCatchMessage);
    if (!res) return;

    var user = JSON.parse(sessionStorage.getItem("user") || "{}") || {};
    user = { ...user, ...res.data };

    if (!user.hasOwnProperty("partial") || user.parial === true) user.partial = type == "partial";

    sessionStorage.setItem("user", JSON.stringify(user));
}

async function getUserInfractionsCount() {
    var res = await axios.get("/api/user/@me/infractions/count").catch(showCatchMessage);
    if (!res) return;

    var user = JSON.parse(sessionStorage.getItem("user") || "{}") || {};
    user.infractions = res.data;

    sessionStorage.setItem("user", JSON.stringify(user));
}

async function getUserStaffAdvices() {
    var res = await axios.get("/api/user/@me/staff-advices/all").catch(showCatchMessage);
    if (!res) return;

    var user = JSON.parse(sessionStorage.getItem("user") || "{}") || {};
    user.staff_advices = res.data;

    sessionStorage.setItem("user", JSON.stringify(user));
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
    scrollUpdate();
});

function scrollUpdate() {
    barHeader?.classList.toggle("banner", window.scrollY > headerSize);
}