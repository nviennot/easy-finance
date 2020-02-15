import {database, objFromFirebase, objToFirebase} from './firebase';
import merge from 'deepmerge';

export async function getBanks() {
  const result = await database().ref("banks").once('value');
  let banks = objFromFirebase(result.val()) || [];
  banks = banks.map(bank => ({accounts: [], ...bank}));
  return banks;
}

export async function putBanks(banks) {
  banks = objToFirebase(banks);

  /*
   * When we do updates, firebase doesn't do deep merges.
   * This is quite upsetting. We'll do the deep-merge here.
   */
  const ref = database().ref("banks");
  if (banks) {
    let origBanks = await ref.once('value');
    origBanks = origBanks.val() || {};
    banks = merge(origBanks, banks);
  }

  await ref.set(banks);
}

export async function backup() {
  const banks = await getBanks();

  const str = `export const data = ${JSON.stringify(banks, null, 2)};`
  console.log(str);
}
