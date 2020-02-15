import admin from 'firebase-admin';

const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountB64)
  throw "FIREBASE env keys are not set. Run 'source with_env.sh' first";

const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountB64, 'base64').toString('ascii'));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
  });
} catch (err) {
  /* Hot reload spurious errors */
  if (!/more than once/.test(err.message))
    throw err;
}

/*
 * Firebase doesn't support arrays. We like arrays. So we have two helper
 * functions to deal with this.
 * XXX This technique does not allow us to have nested objects
 * that are not meant to be repeated and represented as an array.
 */
export function objFromFirebase(rootObj) {
  if (rootObj === null)
    return null;

  const isObject = v => v instanceof Object && v !== null;

  return Object.entries(rootObj).map(([id, obj]) => {
    obj = Object.fromEntries(Object.entries(obj)
      .filter(([k,v]) => k != '_empty')
      .map(([k,v]) => {
        if (isObject(v))
          v = objFromFirebase(v);
        return [k, v];
      }));
    return {id: id, ...obj};
  }).sort((a,b) => a._index - b._index);
}

export function objToFirebase(rootObj) {
  if (rootObj instanceof Array) {
    return Object.fromEntries(rootObj.map((v,i) => {
      const {id, ...obj} = v;
      return [id, {_index: i, ...objToFirebase(obj)}];
    }));
  }

  if (rootObj instanceof Object) {
    if (Object.entries(rootObj).length === 0)
      return {_empty: true}; // Otherwise, firebase ignore our object

    return Object.fromEntries(
      Object.entries(rootObj).map(([k,v]) => {
        return [k, objToFirebase(v)];
      })
    );
  }

  return rootObj;
}

export const database = admin.database;
