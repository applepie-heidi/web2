import {Express, Request, Response, NextFunction} from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config()

type User = {
    username: string
}

declare global {
    namespace Express {
        export interface Request {
            user?: User
        }
    }
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            COOKIE_KEY: string
        }
    }
}

let _loginUrl: string;

function initCookieAuth(app: Express, loginUrl: string) {
    _loginUrl = loginUrl;
    app.use(cookieParser(process.env.COOKIE_KEY));
    app.use(setUserInfo);
}

function signInUser(res: Response, username: string, vulnerable: boolean = false) {
    if (vulnerable) {
        res.cookie('user', username, {
            signed: false,
            httpOnly: true
        });
    }
    else {
        res.cookie('user', username, {
            signed: true,
            httpOnly: true
        });
    }
}

function signOutUser(res: Response) {
    res.clearCookie('user');
}

function setUserInfo(req: Request, res: Response, next: NextFunction) {
    const username = req.signedCookies?.user;
    if (username) {
        req.user = {
            username
        };
    }
    next();
}

function requiresAuthentication(req: Request, res: Response, next: NextFunction) {
    if (req.user) {
        console.log("next!");
        next();
    } else {
        console.log("redirecting!");
        res.redirect(302, `${_loginUrl}?returnUrl=${req.url}`);
    }
}

export {initCookieAuth, signInUser, signOutUser, requiresAuthentication};