import express from 'express';
import path from 'path'

const cookieParser = require('cookie-parser');
import {Pool, QueryResult} from 'pg';
import * as auth from "./middleware";

function sleep(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

const poolCfg = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'web2lab2db',
    password: process.env.DB_PASSWORD,
    port: 5432,
    ssl: false
};
const pool = new Pool(poolCfg);

export async function getUserPass(username: string, vulnerable: boolean = false) {
    console.log("getUserPass", username, vulnerable);
    let results: QueryResult;
    if (vulnerable) {
        results = await pool.query("SELECT pass FROM info WHERE username = '".concat(username).concat("'"));
    } else {
        results = await pool.query("SELECT pass FROM info WHERE username = $1", [username]);
    }
    console.log("rows", typeof results.rows, results.rows);
    let password = results.rows.length ? results.rows[0]["pass"] : null;
    console.log("getUserPass -> ", password);
    return password;
}

export async function userExists(username: string) {
    let results = await pool.query("SELECT username FROM info WHERE username = $1", [username]);
    const comments: string[] = [];
    results.rows.forEach(r => {
        comments.push(r["comment"]);
    });
    return comments.length != 0;
}

/*
const sqlVulnerableCheckbox = document.getElementById(
    'vul1',
) as HTMLInputElement | null;

const authVulnerableCheckbox = document.getElementById(
    'vul2',
) as HTMLInputElement | null;
*/
const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'pug');

auth.initCookieAuth(app, 'login');

app.get('/', function (req, res) {
    res.render('index', {user: req.user});
});

app.get('/login', function (req, res) {
    res.render('login');
});

let loginAttempts = 0;

app.post('/login', async function (req, res) {
    loginAttempts += 1;
    const username = req.body.username;
    const password = req.body.password;
    const sqlVulnerable = req.body.unsecure_sql === "SQL";  // "SQL" ako kliknuto inače undefined
    const authVulnerable = req.body.unsecure_auth === "AUTH";
    console.log("POST /login", username, password, "sqlVulnerable", sqlVulnerable, "authVulnerable", authVulnerable);
    let storedPassword = await getUserPass(username, sqlVulnerable);
    if (password !== storedPassword) {
        console.log("POST /login rendering login");
        if (authVulnerable) {
            if (storedPassword == null) {
                res.render('login', {message: "Wrong username."});
            } else {
                res.render('login', {message: "Wrong password."});
            }
        } else {
            if (loginAttempts > 2) {
                console.log("Too many login attempts.")
                res.render('login', {message: "Too many login attempts."});
                await sleep(20000);
            } else {
                console.log("Wrong username or password.")
                res.render('login', {message: "Wrong username or password."});
            }
        }
    } else {
        loginAttempts = 0;
        console.log("POST /login signing in user");
        auth.signInUser(res, username);

        const returnUrl = req.query.returnUrl;
        if (typeof returnUrl === 'string') {
            console.log("POST /login redirecting to", returnUrl);
            res.redirect(returnUrl);
        } else {
            console.log("POST /login redirecting to /");
            res.redirect("/");
        }
    }
});

app.post('/logout', function (req, res) {
    auth.signOutUser(res);
    res.redirect("/");
});

app.get('/private', auth.requiresAuthentication, async function (req, res) {
    const username = req.user!.username;
    if (await userExists(username)) {
        res.render('private', {user: req.user});
    } else {
        res.status(403);
        res.end('Forbidden for ' + username);
    }
});

const hostname = '127.0.0.1';
const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 4080;
if (externalUrl) {
    app.listen(port, hostname, () => {
        console.log(`Server locally running at http://${hostname}:${port}/ and fromoutside on ${externalUrl}`);
    });

} else {
    app.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    });
}
