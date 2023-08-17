export default class Cookie {
  name: string;
  value: string;
  expires?: Date | string;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  raw?: string;

  constructor(name: string, value: string) {
    this.name = name;
    this.value = value;
  }

  static parse(cookieString: string): Cookie {
    const cookieParts = cookieString.split(';');
    const [name, value] = cookieParts.shift()?.split('=') ?? ['', ''];

    const cookie = new Cookie(name.trim(), value.trim());

    for (const part of cookieParts) {
      const [key, val] = part.split('=').map((item) => item.trim());

      if (key === 'expires') {
        cookie.expires = val === 'Session' ? 'Session' : new Date(val);
      } else if (key === 'Max-Age') {
        cookie.maxAge = parseInt(val);
      } else if (key === 'path') {
        cookie.path = val;
      } else if (key === 'domain') {
        cookie.domain = val;
      } else if (key === 'secure') {
        cookie.secure = true;
      } else if (key === 'httponly') {
        cookie.httpOnly = true;
      } else if (key === 'samesite') {
        cookie.sameSite = val as 'Strict' | 'Lax' | 'None';
      }

      cookie.raw = cookieString;
    }

    return cookie;
  }

  simple() {
    return `${this.name}=${this.value}`
  }

  // Merges the 2 arrays of cookies, other will override original if they have the same name
  static merge(original: Cookie[], other: Cookie[]) {
    if (!original) return other;

    const newCookies = original;

    other.forEach(cookie => {

      const index = original.findIndex(it => it.name === cookie.name);
      if (index !== -1) {
        newCookies[index] = cookie;
      } else {
        newCookies.push(cookie);
      }
    })

    return newCookies
  }

  static header(cookies: Cookie[]) {
    return cookies.map(it => it.raw).join(';')
  }
}
