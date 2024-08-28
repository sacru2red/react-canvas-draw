const cpy = require('cpy');

(async () => {
	await cpy(['type-build/*.d.ts'], 'type');
	console.log('Files copied!');
})();
