let webServer = require("../index");

webServer.viewRoot(__dirname);
webServer.static(__dirname);

const home = async (ctx) => {
    await ctx.view("public/index.html");
}

webServer.routes([
    { path: "/html", method: "GET", handler: home }
]);

webServer.stopOnInt();
webServer.start(7861, true);