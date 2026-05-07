// Run a REST query and return the result as a consumption array

"use strict";

const jsonpointer = require("jsonpointer");

class Item {
	constructor(from, consumption, consumptionUnit) {
		this.from = from;
		this.consumption = consumption;
		this.consumptionUnit = consumptionUnit;
	}
	toString() {
		return this.from + ": " + this.consumption + " " + this.consumptionUnit;
	}
}

exports.prometheus = async function (config) {
	const to = new Date();
	let from = new Date(to);
	from.setHours(to.getHours() - 23);
	from.setMinutes(0);
	from.setSeconds(0);
	from.setMilliseconds(0);
	const toTime = JSON.stringify(to).replace(/\"/g, "");
	const fromTime = JSON.stringify(from).replace(/\"/g, "");
	let query = "http://" + config.host + ":" + config.port + "/api/v1/query_range?query=increase(" + config.metric;
	if (config.tags && config.tags.length > 0) {
		query = query + "{";
		config.tags.forEach((t) => {
			query = query + t.tag + "=" + '"' + t.value + '"';
		});
		query = query + "}";
	}

	query = query + "[1h])&start=" + fromTime + "&end=" + toTime + "&step=3600";

	try {
		const res = await fetch(query, {
			headers: {
				"Content-Type": "application/json"
			},
			method: "GET"
		});
		const body = await res.json();
		const arr = jsonpointer.get(body, "/data/result/0/values");
		const consumptionArr = !arr
			? []
			: arr.map((v) => {
					const time = jsonpointer.get(v, "/0");
					const value = jsonpointer.get(v, "/1");
					let from = new Date(time * 1000);
					from.setHours(from.getHours() - 1);
					const item = new Item(from, Math.round(value * 100) / 100, "kWh");
					return item;
			  });
		return {
			label: config.label,
			data: consumptionArr
		};
	} catch (e) {
		console.error("Failed to read from Prometheus: ", e);
		return { label: config.label, data: [] };
	}
};
