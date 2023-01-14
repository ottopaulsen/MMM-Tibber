class TibberData {
	constructor(payload) {
		this.tibberData = payload;
	}

	getCurrentPrice() {
		return this.tibberData.prices.current.total;
	}

	consumptionUnit() {
		const totalConsumption = this.tibberData.totalConsumption;
		return totalConsumption[0] ? totalConsumption[0].consumptionUnit : "";
	}

	priceData(showFromTime, showToTime, colorForPriceLevel) {
		const tibberData = this.tibberData;
		const firstPriceTime = tibberData.prices.twoDays[0].startsAt;
		const priceData = extractPriceDataFromConsumption()
			.concat(extractPriceDataFromPrices())
			.filter((p) => {
				return p.x >= showFromTime && p.x <= showToTime;
			});
		priceData.minPrice = priceData.reduce((min, p) => (p.y < min ? p.y : min), priceData[0].y);
		priceData.maxPrice = priceData.reduce((max, p) => (p.y > max ? p.y : max), priceData[0].y);
		return priceData;

		function extractPriceDataFromConsumption() {
			return tibberData.totalConsumption
				.filter((c) => {
					return c.to <= firstPriceTime;
				})
				.map((c) => {
					return {
						x: Date.parse(c.from),
						y: c.unitPrice,
						color: colorForPriceLevel("UNKNOWN", 0),
						id: ""
					};
				});
		}

		function extractPriceDataFromPrices() {
			const prices = tibberData.prices;
			return prices.twoDays.map((p, i, arr) => {
				const last = arr.length - 1;
				const now = Date.parse(prices.current.startsAt);
				const t = Date.parse(p.startsAt);
				const ci = t < now ? 0 : t === now ? 1 : 2;
				return {
					x: t,
					y: p.total,
					color: colorForPriceLevel(p.level, ci),
					id: t === now ? "cur" : i == last ? "last" : ""
				};
			});
		}
	}

	consumptionData(showFromTime, showConsumptionParts, colorFromLabel) {
		const res = [];
		let opacity = 1;
		if (showConsumptionParts) {
			this.tibberData.consumptions.map((p) => {
				if (p.data.length > 0) {
					res.push({
						label: p.label,
						stack: 2,
						color: colorFromLabel(p.label),
						visible: true,
						opacity: opacity,
						data: p.data
							.map((c) => {
								let t = Date.parse(c.from);
								return {
									x: t,
									y: c.consumption,
									id: c.consumption === this.maxConsumption() ? "maxCon" : c.consumption === this.minConsumption() ? "minCon" : ""
								};
							})
							.filter((c) => c.x >= showFromTime)
					});
					opacity = opacity * 0.8;
				}
			});
		}
		res.push({
			label: "Total",
			stack: 1,
			visible: !showConsumptionParts,
			opacity: 1,
			data: this.tibberData.totalConsumption
				.map((c) => {
					let t = Date.parse(c.from);
					return {
						x: t,
						y: c.consumption,
						id: c.consumption === this.maxConsumption() ? "maxCon" : c.consumption === this.minConsumption() ? "minCon" : ""
					};
				})
				.filter((c) => c.x >= showFromTime)
		});
		console.log("showFromTime: ", showFromTime);
		console.log("res: ", res);
		return res;
	}

	minConsumption() {
		const totalConsumption = this.tibberData.totalConsumption;
		return totalConsumption.reduce((min, c) => (c.consumption < min ? c.consumption : min), totalConsumption[0] ? totalConsumption[0].consumption : null);
	}

	maxConsumption() {
		const totalConsumption = this.tibberData.totalConsumption;
		return this.tibberData.totalConsumption.reduce((max, c) => (c.consumption > max ? c.consumption : max), totalConsumption[0] ? totalConsumption[0].consumption : null);
	}
}
