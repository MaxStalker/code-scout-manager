import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";
import * as fcl from "@onflow/fcl";
import { extractImports } from "@onflow/flow-cadut";
import { readJSON, writeJSON } from "./json.mjs";
import fs from "fs";

const prisma = new PrismaClient();

const setup = async () => {
  fcl.config().put("accessNode.api", "https://rest-mainnet.onflow.org");
  await prisma.$connect();
};

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
  // const data = await fcl.send([fcl.getAccount(address)]).then(fcl.decode);

  const data = await fcl.query({
    cadence: `
      pub fun main():Int{
        return 42
      }
    `,
  });

  console.log({ data });

  const contracts = [{ Basic: "// Hello, World" }];
  const account = {
    contracts,
  };

  /*  const contractNames = Object.keys(account.contracts);
  for (const contractName of contractNames) {
    const code = account.contracts[contractName];
    // const imports = filterImports(extractImports(code));
    const imports = {
      "Test": "0x1"
    };
    console.log({ imports });
    contracts[contractName] = {
      code,
      imports,
    };
  }*/
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

  // console.log(contracts);
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

  console.log("-------------------------------------->");

  const locations = await prisma.location.findMany();
  console.log({ locations });

  /*  const list = readJSON("./list.json");
  for (const index in list) {
    const address = list[index]
    await addToDatabase(address)
  }*/
};

const getAccount = async (address) => {
  const url = `https://rest-mainnet.onflow.org/v1/accounts/${address}?expand=contracts`;
  const data = await fetch(url).then((res) => res.json());
  const { contracts } = data;
  const result = Object.keys(contracts).reduce((acc, key) => {
    const contract = Buffer.from(contracts[key], "base64").toString();
    acc[key] = contract;
    return acc;
  }, {});
  return result;
};

const collectContracts = async () => {
  const data = readJSON("./contracts.json");
  const duped = data.reduce((acc, item) => {
    acc.push(item.address);
    return acc;
  }, []);
  const list = Array.from(new Set(duped));
  console.log(duped.length, list.length);

  for (let i = 0; i < list.length; i++) {
    const address = list[i];
    const contracts = await getAccount(address);

    const dir = `./cadence/${address}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const contractList = Object.keys(contracts);
    const plural = contractList.length > 1 ? "s" : "";
    console.log(
      `Saving ${contractList.length} contract${plural} for ${address}`
    );
    contractList.forEach((key) => {
      const contract = contracts[key];
      fs.writeFileSync(`./cadence/${address}/${key}.cdc`, contract);
    });
  }
};

const getAccounts = (dataType = "contracts") => {
  const accounts = fs.readdirSync("./cadence");
  return accounts.reduce((acc, key) => {
    const path = `./cadence/${key}`;
    const files = fs.readdirSync(path);
    const contractData = files.reduce((acc, subPath) => {
      const path = `./cadence/${key}/${subPath}`;
      const content = fs.readFileSync(path).toString();
      const contractName = subPath.slice(0, -4);
      acc[contractName] =
        dataType === "imports" ? extractImports(content) : content;
      return acc;
    }, {});
    acc[key] = contractData;
    return acc;
  }, {});
};

const saveProgress = (address, name) => {
  const data = readJSON("./processed.json");
  if (!data[address]) {
    data[address] = {};
  }
  data[address][name] = true;
  writeJSON("./processed.json", data);
  console.log(`${address} on ${name} was stored to database`);
};

const padAddress = (address) => {
  const [prefix, value] = address.split("x");
  return `${prefix}x${value.padStart(16, 0)}`;
};

const addContracts = async () => {
  const addresses = fs.readdirSync("./cadence");
  const limit = addresses.length;
  for (let i = 0; i < limit; i++) {
    const address = addresses[i];
    const files = fs.readdirSync(`./cadence/${address}`);
    const data = [];
    for (let j = 0; j < files.length; j++) {
      const subPath = files[j];
      const path = `./cadence/${address}/${subPath}`;
      const code = fs.readFileSync(path).toString();
      const name = subPath.slice(0, -4);
      data.push({
        name,
        code,
        address: padAddress(address),
      });
    }

    await prisma.contract.createMany({ data });
    console.log(`Processed contracts at ${address}`);
  }
};

const connectImports = async () => {
  const processed = readJSON("./processed.json");

  const importList = readJSON("./imports.json");
  const addresses = Object.keys(importList);
  for (let i = 0; i < addresses.length; i++) {
    const key = addresses[i];
    const contractList = Object.keys(importList[key]);
    for (let j = 0; j < contractList.length; j++) {
      const contract = contractList[j];
      if (processed[key] && processed[key][contract]) {
        console.log(`${i}/${j} - PROCESSED: ${key} - ${contract}`);
        continue;
      }
      const imports = importList[key][contract];
      const connectedList = Object.keys(imports)
        .filter((name) => {
          return imports[name].startsWith("0x");
        })
        .map((name) => {
          return {
            name_address: {
              address: padAddress(imports[name]),
              name,
            },
          };
        });
      console.log(`${i} - Processing ${contract} on ${key}`, connectedList);
      await prisma.contract.update({
        where: {
          name_address: {
            name: contract,
            address: padAddress(key),
          },
        },
        data: {
          imports: {
            connect: connectedList,
          },
        },
      });
      console.log(`Added imports for ${contract} on ${key}`);

      saveProgress(key, contract);
    }
  }
  console.log("all imports are processed");
};

const addContractsFromAddress = async (address) => {
  const account = await getAccount(address);

  const data = Object.keys(account).map((name)=>{
    return {
      name,
      code: account[name],
      address: padAddress(address),
    }
  })

  await prisma.contract.createMany({ data });
  console.log(`Added ${data.length} contracts for ${address}`);
};

(async () => {
  await setup();
  // const data = getAccounts("imports");
  // writeJSON("./imports.json", data)
  // await addContracts()
  // await addContractsFromAddress("0x2ba17360b76f0143");
  await connectImports();
  console.log("done");
  /*  flow().then(() => {
    console.log("done");
  });*/
})();
