{
    let lastUpdate = sessionStorage.getItem("lastUpdate") || 0;
    let user = sessionStorage.getItem("user");
    if (user && !isAuthenticated()) resetSession();

    if ((new Date().getTime() - lastUpdate >= 2 * 60 * 1000 || !user) && isAuthenticated()) {
        getUser().finally(() => userFetched("partial"));
        sessionStorage.setItem("lastUpdate", new Date().getTime());
    } else userFetched("partial");
}