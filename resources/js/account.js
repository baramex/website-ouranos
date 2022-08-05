let lastUpdate = sessionStorage.getItem("lastUpdate") || 0;
let user = sessionStorage.getItem("user");
if (user && !isAuthenticated()) resetSession();

if ((new Date().getTime() - lastUpdate >= 2 * 60 * 1000 || !user || JSON.parse(user).partial) && isAuthenticated()) {
    getUser("complete", "username,discriminator,challenges,avatarURL,email,grades,date,lvl,exp,guilds,coins", true).finally(() => {
        getUserInfractionsCount().finally(() => {
            userFetched("complete");
        });
    });
    sessionStorage.setItem("lastUpdate", new Date().getTime());
} else userFetched("complete");