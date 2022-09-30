const { CadenceParser } = require("@onflow/cadence-parser");
const fs = require("fs");
const path = require("path");
const pc = require("@prisma/client");
const { code } = require("./test-code");

const prisma = new pc.PrismaClient();

function readJSON(db) {
  let rawdata = fs.readFileSync(db);
  return JSON.parse(rawdata);
}

function writeJSON(db, data) {
  let raw = JSON.stringify(data, null, 2);
  fs.writeFileSync(db, raw);
}

function isContract(item) {
  return (
    item.CompositeKind === `CompositeKindContract` &&
    item.Type === "CompositeDeclaration"
  );
}

function isContractInterface(item) {
  return (
    item.Type === "InterfaceDeclaration" &&
    item.CompositeKind === "CompositeKindContract"
  );
}

function findContract(ast) {
  return ast.program.Declarations.find(isContract);
}

function findInterface(ast) {
  return ast.program.Declarations.find(isContractInterface);
}

function getConformances(contract) {
  return contract.Conformances.map((item) => {
    return item.Identifier.Identifier;
  });
}

(async () => {
  const parser = await CadenceParser.create(
    await fs.promises.readFile(
      path.join(
        __dirname,
        "./node_modules/@onflow/cadence-parser/dist/cadence-parser.wasm"
      )
    )
  );

  const code1 = `
  import NonFungibleToken from 0x01
  import MetadataViews from 0x02
  pub contract HelloWorld: NonFungibleToken {
    pub fun hello() {
      log("Hello, world!")
    }
  }
`;
  const code2 = `
    pub contract interface Basic{}
  `;

  const ast = parser.parse(code);
  writeJSON("./ast.json", ast)

  const contract = findContract(ast);
  const interface = findInterface(ast);

  console.log({ contract });
  console.log({ interface });

  if (contract) {
    const tags = getConformances(contract);
    console.log(tags);
  }

  /*
  const contract = ast.program.Declarations.find((item) => {
    return (
      item.CompositeKind === `CompositeKindContract` &&
      item.Type === "CompositeDeclaration"
    );
  });
  //
  console.log(contract);
  contract.Conformances.forEach(c=>{
    console.log(c.Identifier.Identifier)
  })

   */
})();
