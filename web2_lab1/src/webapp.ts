import express from 'express';
import fs from 'fs';
import path from 'path'
import https from 'https';
import { auth, requiresAuth } from 'express-openid-connect';
import dotenv from 'dotenv'
dotenv.config()

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'pug');

const port = 4080;

const config = {
  authRequired : false,
  idpLogout : true, //login not only from the app, but also from identity provider
  secret: 'proizvoljno',
  baseURL: `https://localhost:${port}`,
  clientID: 'g6rdQD7fL1mWB106rr34IoulMRihesB4',
  issuerBaseURL: 'https://dev-a1hoxpqf7enjxxm0.us.auth0.com',
  clientSecret: 'wzPxhWC2R5ywVSvzYWEHz0jwIdU5zhAivEU7SQwowzQie85SelqTci6BbBUo9djP',
  authorizationParams: {
    response_type: 'code' ,
    //scope: "openid profile email"
   },
};
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

app.get('/',  function (req, res) {
  let username : string | undefined;
  if (req.oidc.isAuthenticated()) {
    username = req.oidc.user?.name ?? req.oidc.user?.sub;
  }
  res.render('index', {username});
});

app.get('/private', requiresAuth(), function (req, res) {
    const user = JSON.stringify(req.oidc.user);
    res.render('private', {user});
});

app.get("/sign-up", (req, res) => {
  res.oidc.login({
    returnTo: '/',
    authorizationParams: {
      screen_hint: "signup",
    },
  });
});

https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
  }, app)
  .listen(port, function () {
    console.log(`Server running at https://localhost:${port}/`);
  });

/*
const { requiresAuth } = require('express-openid-connect');

app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});
 */
