const cpy = require('cpy');

(async () => {
	await cpy(['src/*.d.ts'], 'type');
	console.log('Files copied!');
})();
