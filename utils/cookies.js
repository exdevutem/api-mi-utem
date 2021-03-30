

const sesionStringToJsonCookies = (sessionString) => {
    const sessionId = sessionString.slice(0, 32);
    const csrfToken = sessionString.slice(32);

    let date = new Date();
    date.setDate(date.getDate() + 364);

    return [
        {
            "name": "sessionid",
            "value": sessionId,
            "domain": "mi.utem.cl",
            "path": "/",
            "expires": -1,
            "size": 41,
            "httpOnly": true,
            "secure": false,
            "session": true,
            "sameSite": "Lax"
        },
        {
            "name": "MIUTEM",
            "value": "miutem1",
            "domain": "mi.utem.cl",
            "path": "/",
            "expires": -1,
            "size": 13,
            "httpOnly": false,
            "secure": false,
            "session": true
        },
        {
            "name": "csrftoken",
            "value": csrfToken,
            "domain": "mi.utem.cl",
            "path": "/",
            "expires": date.getTime() / 1000,
            "size": 73,
            "httpOnly": false,
            "secure": false,
            "session": false,
            "sameSite": "Lax"
        },
        {
            "name": "dialogShown",
            "value": "0",
            "domain": "mi.utem.cl",
            "path": "/",
            "expires": date.getTime() / 1000,
            "size": 1,
            "httpOnly": false,
            "secure": false,
            "session": false,
        }
    ];
}

const jsonCookiesToStringSesion = (jsonCookies) => {
    let sessionId;
    let csrfToken;

    for (const cookie of jsonCookies) {
        if (cookie.name == "sessionid") {
            sessionId = cookie.value;
        }
        if (cookie.name == "csrftoken") {
            csrfToken = cookie.value;
        }
    }
    return sessionId + csrfToken;
}

module.exports = {sesionStringToJsonCookies, jsonCookiesToStringSesion};