fetch("/static/header.html").then(res => res.text()).then(txt => document.getElementById("header").innerHTML = txt);
fetch("/static/footer.html").then(res => res.text()).then(txt => {
    var footer = document.getElementById("footer");
    if (footer) footer.innerHTML = txt;
    else
        window.addEventListener("load", () => {
            document.getElementById("footer").innerHTML = txt;
        });
});

let __body;
let barHeader;
let headerSize;
window.addEventListener("load", async () => {
    __body = true;

    // remove #
    history.pushState("", document.title, window.location.pathname + window.location.search);

    // update header banner
    barHeader = document.body.querySelector("header#main-header");
    headerSize = document.getElementById("main").clientHeight - 320 - 80;
    scrollUpdate();

    // show popup
    let popup = getCookie("popup");
    if (popup) {
        deleteCookie("popup");
        popup = JSON.parse(popup);
        if (popup.type == "success") showSuccess(getMessage(popup.content));
        else if (popup.type == "error") showErrorMessage(getMessage(popup.content));
    }

    // navigate
    let navigate = document.getElementById("navigate");
    let path = document.location.pathname;
    if (path != "/") {
        let a = document.createElement("a");
        a.innerText = "accueil";
        a.href = "/";

        let span = document.createElement("span");
        span.innerText = document.title.split("|")[1]?.trim() || path.split("/").reverse()[0];

        let separator = document.createElement("span");
        separator.innerText = " / ";

        navigate.append(a, separator, span);

        navigate.hidden = false;
    }

    let guildSelector = document.getElementById("select-guild");
    guildSelector?.addEventListener("input", e => {
        var value = e.target.value;
        localStorage.setItem("guild", value);
        updateFields("complete");
    });

    updateGuildSelect();
});

function updateFields(type) {
    let user = sessionStorage.getItem("user");
    if (user) {
        const guild = localStorage.getItem("guild");

        user = JSON.parse(user);
        document.getElementById("btn-login").hidden = true;

        let acc = document.getElementById("btn-account");
        acc.hidden = false;

        let names = document.body.getElementsByClassName("name");
        if (names.length > 0)
            for (const i in names) {
                names.item(i).innerText = user.username;
            }
        let avatars = document.body.getElementsByClassName("avatar");
        if (avatars.length > 0)
            for (const i in avatars) {
                avatars.item(i).src = user.avatarURL + (avatars.item(i).classList.contains("large") ? "?size=480" : "");
            }

        if (type == "complete") {
            let tags = document.body.getElementsByClassName("tag");
            if (tags.length > 0)
                for (const i in tags) {
                    tags.item(i).innerText = user.username + "#" + user.discriminator;
                }
            let emails = document.body.getElementsByClassName("email");
            if (emails.length > 0)
                for (const i in emails) {
                    emails.item(i).innerText = user.email;
                }
            let coins = document.body.getElementsByClassName("coins");
            if (coins.length > 0)
                for (const i in coins) {
                    coins.item(i).innerText = user.coins[guild] + " 💰";
                }
            let lvlt = document.body.getElementsByClassName("level-txt");
            if (lvlt.length > 0)
                for (const i in lvlt) {
                    lvlt.item(i).innerText = "Niveau " + (user.lvl[guild] || 1);
                }
            let lvlv = document.body.getElementsByClassName("level-val");
            if (lvlv.length > 0)
                for (const i in lvlv) {
                    lvlv.item(i).setAttribute("ariaValuenow", user.exp[guild] || 0);
                    lvlv.item(i).setAttribute("ariaValuemax", maxExp(user.lvl[guild] || 1));
                    lvlv.item(i).style.width = (100 * user.exp[guild] / maxExp(user.lvl[guild] || 1)) + "%";
                }
            let grades = document.body.getElementsByClassName("grades");
            if (grades.length > 0)
                for (const i in grades) {
                    grades.item(i).innerText = user.grades[guild].map(a => a.name.toLowerCase()).join(", ") || "aucun";
                }
            let from = document.body.getElementsByClassName("from");
            if (from.length > 0)
                for (const i in from) {
                    let date = new Date(user.date);
                    from.item(i).innerText = `le ${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth()+1).padStart(2, "0")}/${date.getFullYear()}`;
                }
            let warns = document.body.getElementsByClassName("warns");
            if (warns.length > 0)
                for (const i in warns) {
                    warns.item(i).innerText = user.infractions[guild].warns + " avertissement";
                }
            let bans = document.body.getElementsByClassName("bans");
            if (bans.length > 0)
                for (const i in bans) {
                    bans.item(i).innerText = user.infractions[guild].bans + " bannissement";
                }
            let mutes = document.body.getElementsByClassName("mutes");
            if (mutes.length > 0)
                for (const i in mutes) {
                    mutes.item(i).innerText = user.infractions[guild].mutes + " mutes";
                }
            let kicks = document.body.getElementsByClassName("kicks");
            if (kicks.length > 0)
                for (const i in kicks) {
                    kicks.item(i).innerText = user.infractions[guild].kicks + " expulsions";
                }
            let certification = document.body.querySelector(".certification");
            if (certification) {
                certification.innerHTML = "";
                if (localStorage.getItem("guild") == "basic") {
                    let p = document.createElement("p");
                    p.innerHTML = "Les certifications de sont pas disponible sur le serveur ouvert.";
                    certification.append(p);
                }
                else {
                    if (user.challenges?.length == 0) {
                        let p = document.createElement("p");
                        p.innerHTML = "Vous n'avez encore passé aucune certification, grâce à elle, vous pourez avoir accès au serveur <i>Ouranos Cerif</i>.";
                        certification.append(p);
                    }
                    let a = document.createElement("a");
                    a.href = "/certification";
                    a.classList.add("btn", "btn-success", "btn-lg", "mt-4");
                    a.innerText = "Nouvelle certification";
                    certification.append(a);
                }
            }
            let staffcomment = document.getElementById("staff-comment");
            if (staffcomment && (user.grades.basic.length > 0 || user.grades.challenge.length > 0)) {
                staffcomment.innerHTML = "";

                let alert = document.createElement("div");
                alert.classList.add("alert", "alert-success");
                alert.role = "alert";
                alert.innerText = "Modifications enregistrées !";
                alert.hidden = true;

                let div = document.createElement("div");
                div.classList.add("form-floating");

                let textarea = document.createElement("textarea");
                textarea.id = "staff-comment-input";
                textarea.style.height = "100px";
                textarea.style.minHeight = "55px";
                textarea.style.maxHeight = "250px";
                textarea.maxLength = 256;
                textarea.style.width = "100%";
                textarea.classList.add("form-control", "flex-shrink-1", "bg-light");
                textarea.placeholder = "Présenatation (staff)...";
                textarea.value = user.presentation || "";

                textarea.onchange = () => {
                    if (textarea.value != user.presentation) {
                        axios.put("/api/user/@me/presentation", { presentation: textarea.value }).then(() => {
                            sessionStorage.setItem("user", JSON.stringify({ ...user, presentation: textarea.value }));
                            alert.getAnimations().forEach(a => a.cancel());
                            alert.hidden = false;
                            alert.animate([{ opacity: 1 }, { opacity: 0 }], { delay: 1000, duration: 500 }).onfinish = () => alert.hidden = true;
                        }, showCatchMessage);
                    }
                };

                let label = document.createElement("label");
                label.for = "staff-comment-input";
                label.innerText = "Présentation (staff)";

                div.append(textarea, label);
                staffcomment.append(alert, div);

                staffcomment.hidden = false;
            }
        }
    }
}

function userFetched(type) {
    if (!__body) return setTimeout(() => userFetched(type), 10);

    updateFields(type);

    // remove loader
    let preloader = document.getElementById("preloader");
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
    let txt = error.data || error.statusText || error;
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
    let cookies = parseCookies(document.cookie);
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

async function getUser(type = "partial", projection = "username,avatarURL") {
    let res = await axios.get("/api/user/@me/" + type, { params: { projection } }).catch(showCatchMessage);
    if (!res) return;

    let user = JSON.parse(sessionStorage.getItem("user") || "{}") || {};
    user = { ...user, ...res.data };

    if (!user.hasOwnProperty("partial") || user.parial === true) user.partial = type == "partial";

    if (user.guilds) {
        if (!localStorage.getItem("guild")) {
            localStorage.setItem("guild", user.guilds.includes("challenge") ? "challenge" : "basic");
            updateGuildSelect();
        }
    }

    sessionStorage.setItem("user", JSON.stringify(user));
}

function updateGuildSelect() {
    let el = document.getElementById("select-guild");
    if (!el) return;
    el.value = localStorage.getItem("guild");
    var user = JSON.parse(sessionStorage.getItem("user") || "{}") || {};
    if (!user.guilds) return;
    if (!user.guilds.includes(localStorage.getItem("guild"))) {
        localStorage.setItem("guild", user.guilds[0]);
        el.value = user.guilds[0];
    }
    if (user.guilds.length == 1) el.querySelector("option[value=" + (user.guilds[0] == "basic" ? "challenge" : "basic") + "]").disabled = true;
}

async function getUserInfractionsCount() {
    let res = await axios.get("/api/user/@me/infractions/count").catch(showCatchMessage);
    if (!res) return;

    let user = JSON.parse(sessionStorage.getItem("user") || "{}") || {};
    user.infractions = res.data;

    sessionStorage.setItem("user", JSON.stringify(user));
}

function showErrorMessage(error, action = null) {
    openPopup("popup-error");
    let popup = document.getElementById("popup-error");
    popup.querySelector("p.text").innerText = error;

    document.getElementById("valid-error").onclick = () => {
        if (action) action();
        closePopup("popup-error");
    };
}

function showSuccess(message, action = null) {
    openPopup("popup-success");
    let popup = document.getElementById("popup-success");
    popup.querySelector("p.text").innerText = message;

    document.getElementById("valid-success").onclick = () => {
        if (action) action();
        closePopup("popup-success");
    };
}

function closePopup(id, hidden = true) {
    let popup = document.getElementById(id);
    if (!popup) return;
    popup.style.transform = "translate(-50%, -50%) scale(0)";

    setTimeout(() => popup.style.display = "none", 300);

    if (hidden) {
        let hidden = document.getElementById("hidden-tab");
        hidden.style.opacity = "0";
        setTimeout(() => hidden.style.display = "none", 300);
    }
}

function openPopup(id) {
    let popup = document.getElementById(id);
    if (!popup) return;

    popup.style.display = "block";
    setTimeout(() => popup.style.transform = "translate(-50%, -50%) scale(1)", 50);

    let hidden = document.getElementById("hidden-tab");
    hidden.style.display = "block";
    setTimeout(() => hidden.style.opacity = "1", 50);
}

window.addEventListener("scroll", () => {
    scrollUpdate();
});

function scrollUpdate() {
    barHeader?.classList.toggle("banner", window.scrollY > headerSize);
}