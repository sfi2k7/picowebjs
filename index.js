let Koa = require("koa");
let koaBodyparser = require("koa-bodyparser");
let Router = require("@koa/router");
let Static = require("koa-static");
const fs = require("fs/promises")
const path = require("path");

const logger = async (ctx, next) => {
    await next();
    console.log(ctx.url, ctx.method, `${new Date().toLocaleTimeString()}`, `${ctx.state.took()}ms`);
}

class WebServer {
    constructor() {
        this.app = new Koa();

        this.router = new Router();
        this.viewrootpath = "";

        this.app.use(async (ctx, next) => {
            ctx.state.start = new Date();
            ctx.state.took = () => {
                return (new Date() - ctx.state.start)
            }

            ctx.json = (obj) => {
                ctx.body = JSON.stringify(obj)
            }

            ctx.string = (str) => {
                ctx.body = str;
            }

            ctx.html = async (fileName) => {
                try {
                    let fullfilename = path.join(this.viewrootpath, fileName);
                    ctx.type = "text/html; charset=UTF-8";
                    let filebody = await fs.readFile(fullfilename, { encoding: "utf8" });
                    ctx.body =filebody
                } catch (error) {
                    console.log(error)
                    ctx.status = 404;
                }
            }

            ctx.view = async (filename)=>{
                await ctx.html(filename);    
            }


            await next();
        })

        this.app.use(koaBodyparser());

        this._server = null;
        this.root = "./public";

        // this.Logger = this.Logger.bind(this);
        this.start = this.start.bind(this);
        this.shutDown = this.shutDown.bind(this);
        this.route = this.route.bind(this);
        this.routes = this.routes.bind(this);
        this._routeSingle = this._routeSingle.bind(this);
    }

    static(root, options) {
        this.app.use(Static(root || this.root, options));
    }

    viewRoot(root) {
        this.viewrootpath = root;
    }

    _routeSingle(single) {
        if (typeof single.path === "undefined") {
            return;
        }

        if (typeof single.handler === "undefined" || single.handler == null) {
            return;
        }

        if (typeof single.method === "undefined") {
            single.method = "get"
        }


        this.route(single.path, single.method, single.handler);
    }

    route(path, method = 'get', handler) {
        this.router[method.toLowerCase()](path, handler);
    }

    routes(list = [{ path: '', method: '', handler: null }]) { //path,method,handler
        for (const item of list) {
            this._routeSingle(item);
        }
    }

    start(port = 5050, enableLogging = false, middlewares = [async (ctx, next) => { await next() }]) {

        if (enableLogging == true) {
            middlewares.push(logger);
        }

        for (const middle of middlewares) {
            this.app.use(middle);
        }

        this.app.use(this.router.routes()).use(this.router.allowedMethods());

        this._server = this.app.listen(port);
    }

    stopOnInt() {
        process.on('SIGTERM', this.shutDown);
        process.on('SIGINT', this.shutDown);
    }

    shutDown() {
        console.log("Stopping Server")
        this._server.close()
    }
}


let webServer = new WebServer();
module.exports = webServer;