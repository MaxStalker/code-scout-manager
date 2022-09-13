import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";
import * as fcl from "@onflow/fcl";
import { extractImports } from "@onflow/flow-cadut";
import { writeJSON } from "./json.mjs";

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
  console.log(`Processing: ${address}`);
  const { account } = await fcl.send([fcl.getAccount(address)]);
  const contractNames = Object.keys(account.contracts);
  for (const contractName of contractNames) {
    const code = account.contracts[contractName];
    const imports = filterImports(extractImports(code));
    console.log(contractName);
    add(contractName, {
      name: contractName,
      // code,
      imports,
    });
  }
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

const flow = async () => {

  const contracts = {};
  const address = "0x01ab36aaf654a13e";
  await processAddress(address, (name, data) => {
    contracts[name] = data;
  });
  console.log(contracts);

  for (let key of Object.keys(contracts)) {
    const contract = contracts[key]

    const contract = await prisma.contract

  }

};


flow();
