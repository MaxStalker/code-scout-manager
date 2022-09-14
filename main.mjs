import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";
import * as fcl from "@onflow/fcl";
import { extractImports } from "@onflow/flow-cadut";
import { readJSON, writeJSON } from "./json.mjs";

const prisma = new PrismaClient();
fcl.config().put("accessNode.api", "https://rest-mainnet.onflow.org");

const main = async () => {
  const contracts = await prisma.contract.findMany({});
  console.log({ contracts });
};

const makeTag = async () => {
  const tag = await prisma.tag.create({
    data: {
      name: "Flabergasted",
    },
  });
  console.log({ tag });
};

const filterImports = (imp) => {
  const keys = Object.keys(imp).filter((item) => !item.includes("/"));
  const clear = {};
  for (const key of keys) {
    clear[key] = imp[key];
  }
  return clear;
};

const processAddress = async (address, add) => {
  const contracts = {};
  const { account } = await fcl.send([fcl.getAccount(address)]);
  const contractNames = Object.keys(account.contracts);
  for (const contractName of contractNames) {
    const code = account.contracts[contractName];
    const imports = filterImports(extractImports(code));
    console.log({ imports });
    contracts[contractName] = {
      code,
      imports,
    };
  }
  return contracts;
};

const getList = async () => {
  const url = `https://api.github.com/repos/bluesign/flow-mainnet-contracts/git/trees/main?recursive=1`;
  const list = await fetch(url);
  const json = await list.json();

  const { tree } = json;
  const data = tree.map(({ path }) => {
    const [, address, name] = path.split(".");
    return { address: `0x${address}`, name, processed: false };
  });

  writeJSON("./contracts.json", data);
};

const addToDatabase = async (address) => {
  const contracts = await processAddress(address, (name, data) => {
    contracts[name] = data;
  });

  console.log(contracts);
  console.log("done processing contracts");
  console.log("out of loop");
};

const collectAddresses = async () => {
  const data = readJSON("./contracts.json");
  const list = data.reduce((acc, item) => {
    acc.push(item.address);
    return acc;
  }, []);
  writeJSON("./list.json", list);
};

// collectAddresses();

const flow = async () => {
  await addToDatabase("0x01ab36aaf654a13e");

  const locations = await prisma.location.findMany();
  console.log({ locations });

  /*  const list = readJSON("./list.json");
  for (const index in list) {
    const address = list[index]
    await addToDatabase(address)
  }*/
};

flow().then(() => {
  console.log("done");
});

/*
(async ()=>{
  const contracts = await prisma.contract.findMany({})
  console.log({contracts})
})()*/
