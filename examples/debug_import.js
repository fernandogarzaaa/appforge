
import * as Module from '../universal_quantum_dist/index.js';
console.log('Keys:', Object.keys(Module));
console.log('Module:', Module);
try {
    const Default = Module.default;
    console.log('Default Export:', Default);
} catch (e) {
    console.log('No Default Export');
}
