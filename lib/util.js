import crypto from 'crypto';

export function zip(...rows) {
  if (rows.length === 0)
    throw "zip() got empty rows";

  // https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function
  return rows[0].map((_,c) => rows.map(row => row[c]));
}

export function pick(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([k,v]) => keys.includes(k))
  );
}

export function leftJoin(objsA, objsB, options) {
  let { key, foreignKey, primaryKey} = options;
  primaryKey = primaryKey || 'id';

  const objsBMap = Object.fromEntries(
          objsB.map(b => [b[primaryKey], b]));

  return objsA.map(a => {
    const fk = a[foreignKey];
    return {[key]: fk && objsBMap[fk], ...a};
  });
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatMoney(amount) {
  const sign = amount < 0 ? "-" : "";
  const denom = '$';
  let amountStr = (Math.round(Math.abs(amount) * 100) / 100).toFixed(2);

  return numberWithCommas(`${sign}${denom}${amountStr}`);
}

export function groupBy(objs, fnKey) {
  return objs.reduce(function (acc, obj) {
    const key = fnKey(obj);
    if (!key)
      return acc;
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(obj);
    return acc;
  }, {})
}

export function validateAuth(req, res) {
  const pwValidHash = Buffer.from(process.env.PASSWORD_SHA1, 'hex');

  const { password } = req.body;
  const { passwordHash } = req.cookies;

  let valid = false;

  if (password) {
    const pwUserHash = crypto.createHash('sha1').update(`pwsalt${password}`).digest();
    valid = crypto.timingSafeEqual(pwUserHash, pwValidHash);
    if (valid) {
      const savedHash = pwUserHash.toString('base64');
      const maxAge = 3600*24*30; // one month
      const secure = process.env.NODE_ENV === 'production' ? 'Secure' : '';
      res.setHeader('Set-Cookie', `passwordHash=${savedHash}; Max-Age=${maxAge}; HttpOnly; SameSite=Strict; ${secure}`);
    }
  } else if (passwordHash) {
    const pwUserHash = Buffer.from(passwordHash, 'base64');
    valid = crypto.timingSafeEqual(pwUserHash, pwValidHash);
  }

  return valid;
}

export function ensureAuth(req, res) {
  const valid = validateAuth(req, res);

  if (!valid) {
    res.status(401).json({redirect: '/login'});
    res.end();
  }

  return valid;
}
