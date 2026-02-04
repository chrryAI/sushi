import parse from './compiler/parse.js';
import semantic from './compiler/semantic.js';

const code = `
function makeAdder(x) {
  return function(y) {
    return x + y;
  };
}
`;

const ast = parse(code);
const analyzed = semantic(ast);

// Find the makeAdder function
const makeAdder = ast.body[0];
console.log('makeAdder function:', makeAdder.id.name);
console.log('makeAdder._captured:', makeAdder._captured);

// Find the inner function
const innerFunc = makeAdder.body.body[0].argument;
console.log('\nInner function type:', innerFunc.type);
console.log('Inner function._captured:', innerFunc._captured);

// Check if x is marked as captured
console.log('\nmakeAdder variables:', Object.keys(makeAdder._variables || {}));
if (makeAdder._variables?.x) {
  console.log('Variable x.captured:', makeAdder._variables.x.captured);
}
