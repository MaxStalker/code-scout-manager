const { CadenceParser } = require("@onflow/cadence-parser");
const fs = require("fs");
const path = require("path");

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
`

  const code2 = `
    pub contract interface Basic{}
  `

  const ast = parser.parse(code2);

  console.log(ast.program.Declarations);

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
