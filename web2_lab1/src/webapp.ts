import express from 'express';
import fs from 'fs';
import path from 'path'
import https from 'https';
import {auth, requiresAuth} from 'express-openid-connect';
import dotenv from 'dotenv'
import * as data from './data.json';

dotenv.config()

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'pug');

const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 4080;
const admin = "admin"

const config = {
    authRequired: false,
    idpLogout: true, //login not only from the app, but also from identity provider
    secret: 'proizvoljno',
    baseURL: externalUrl || `https://localhost:${port}`,
    clientID: 'g6rdQD7fL1mWB106rr34IoulMRihesB4',
    issuerBaseURL: 'https://dev-a1hoxpqf7enjxxm0.us.auth0.com',
    clientSecret: 'wzPxhWC2R5ywVSvzYWEHz0jwIdU5zhAivEU7SQwowzQie85SelqTci6BbBUo9djP',
    authorizationParams: {
        response_type: 'code',
        //scope: "openid profile email"
    },
};
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

app.get('/', function (req, res) {
    let username: string | undefined;
    if (req.oidc.isAuthenticated()) {
        console.log("AUTH YES")
        username = req.oidc.user?.nickname ?? req.oidc.user?.sub;
    }
    res.render('index', {username, data});
});

app.get('/private', requiresAuth(), function (req, res) {
    const username = req.oidc.user?.nickname;
    if (username == admin) {
        res.render('admin', {username, data});
    } else {
        res.render('private', {username, data});
    }
});

app.get("/sign-up", (req, res) => {
    res.oidc.login({
        returnTo: '/',
        authorizationParams: {
            screen_hint: "signup",
        },
    });
});

app.get("/logout", (req, res) => {
    res.oidc.logout({
        returnTo: '/'
    })
});

if (externalUrl) {
    const hostname = '127.0.0.1';
    app.listen(port, hostname, () => {
        console.log(`Server locally running at http://${hostname}:${port}/ and from
outside on ${externalUrl}`);
    });
}
else {
    https.createServer({
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.cert')
    }, app)
        .listen(port, function () {
            console.log(`Server running at https://localhost:${port}/`);
        });
}