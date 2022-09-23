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

  const ast = parser.parse(`
  pub contract HelloWorld {
    pub fun hello() {
      log("Hello, world!")
    }
  }
`);
  console.log(ast.program.Declarations)
})();