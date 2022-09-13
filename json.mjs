import fs from "fs"

export const readJSON = (db) => {
  let rawdata = fs.readFileSync(db);
  return JSON.parse(rawdata);
};

export const writeJSON = (db, data) => {
  let raw = JSON.stringify(data, null, 2);
  fs.writeFileSync(db, raw);
};
