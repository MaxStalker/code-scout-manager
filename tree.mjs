import fs from "fs";

function readJSON(db) {
  let rawdata = fs.readFileSync(db);
  return JSON.parse(rawdata);
}

function getIdentifier(dec) {
  if (dec.Identifiers) {
    // import statements can have multiple identifiers
    return dec.Identifiers[0].Identifier;
  }
  if (dec.Identifier) {
    return dec.Identifier.Identifier;
  }

  return "something else...";
}

function findLeaves(declarations, rule) {
  let result = [];

  for (let i = 0; i < declarations.length; i++) {
    const declaration = declarations[i];

    if (rule(declaration)) {
      result.push(declaration);
    } else if (declaration.Type === "CompositeDeclaration") {
      if (declaration.Members) {
        const other = findLeaves(declaration.Members.Declarations, rule);
        result = result.concat(other);
      }
    }
  }

  return result;
}

function processGetViews(declaration) {
  const block = declaration.FunctionBlock.Block;
  const returnStatement = block.Statements.find(
    (state) => state.Type === "ReturnStatement"
  );
  const values = returnStatement.Expression.Values.map((item) => {
    const annotatedType = item.TypeArguments[0].AnnotatedType;
    const nestedIds = annotatedType.NestedIdentifiers[0];

    const name = nestedIds.Identifier;
    return {
      name,
      type: `Type<MetadataViews.${name}>()`,
    };
  });
  return values;
}

(function () {
  const { program } = readJSON("./ast.json");

  const getViewsDeclaration = findLeaves(program.Declarations, (dec) => {
    const id = getIdentifier(dec);
    return dec.Type === "FunctionDeclaration" && id === "getViews";
  });

  const views = processGetViews(getViewsDeclaration[0]);
  console.log({ views });

  console.log("done!");
})();
