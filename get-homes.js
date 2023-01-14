// This script will list your Tibber homes
// Run this script with:
//   node get-homes.js <token>

const tibber = require("./tibber.js");

const { homesQuery } = require("./tibber-queries");

const token = process.argv[2];

if (!token) {
	console.log("\nTibber token missing.\n");
	console.log("Usage: ");
	console.log("  node get-homes.mjs <token>\n");
	process.exit(1);
}

const getHomes = async function () {
	const { tibberGqlQuery } = await tibber(token);
	const res = await tibberGqlQuery(homesQuery);
	console.log(JSON.stringify(res, null, 2));
};

getHomes();
