"use strict";

const NodeHelper = require("node_helper");
const consumptions = require("./consumptions");

const tibber = require("./tibber");

let tibberApi;

module.exports = NodeHelper.create({
  start: async function () {
    console.log(this.name + ": Starting node helper");
    this.loaded = false;
  },

  log: function (arg1, arg2 = "") {
    if (this.config.logging) {
      console.log(this.name + ": " + arg1 + arg2);
    }
  },

  socketNotificationReceived: async function (notification, payload) {
    if (notification === "TIBBER_CONFIG") {
      if (this.loaded) {
        if (payload.tibberToken != this.config.tibberToken) {
          console.error(
            this.name +
              ": Two or more different tibberTokens detected. That is not supported."
          );
        }
        if (payload.houseNumber != this.config.houseNumber) {
          console.error(
            this.name + ": Two or more houseNumbers detected is not supported."
          );
        }
      } else {
        console.log(this.name + ": Configuring");
        var config = payload;
        this.config = config;
        if (!config.homeId) {
          console.error(this.name + ": You must configure homeId");
          console.log(
            this.name +
              ": You can run 'node get-homes.js <token>' in the module folder, or go to https://developer.tibber.com/ to find your homeId"
          );
          return;
        }
        this.loaded = true;
        console.log(
          this.name +
            ": Tibber update interval: " +
            config.updateInterval +
            " minutes"
        );
        const sub = this.receiveTibberSubscriptionData.bind(this);

        tibberApi = await tibber(this.config.tibberToken);

        tibberApi.subscribe(config.homeId, sub);

        this.handleTibber(config);
        setInterval(() => {
          this.handleTibber(config);
        }, 1000 * 60 * config.updateInterval);
      }
    }
  },

  handleTibber: function (config) {
    const consumptions = this.readConsumptions(config);
    const tibberData = this.readTibberData(config);
    Promise.all([consumptions, tibberData])
      .then((results) => {
        this.sendChartData(
          results[0].filter((r) => r.data.length > 0),
          results[1]
        );
      })
      .catch((e) => {
        console.log("Error: ", e);
      });
  },

  readTibberData: async function (config) {
    return await tibberApi.perHour(config.homeId, config.historyHours);
  },

  sendChartData: function (consumptions, tibber) {
    this.log("Tibber data: ");
    this.log(JSON.stringify(tibber, null, 2));

    this.log("Consumption parts: ");
    this.log(JSON.stringify(consumptions, null, 2));

    const tibberData = {
      consumption: [],
      prices: {
        current: null,
        twoDays: []
      }
    };
    tibberData.prices.current =
      tibber.home.currentSubscription.priceInfo.current;
    tibberData.prices.twoDays = tibber.home.currentSubscription.priceInfo.today.concat(
      tibber.home.currentSubscription.priceInfo.tomorrow
    );
    if (tibber.home.consumption) {
      tibberData.totalConsumption = tibber.home.consumption.nodes.filter(
        (n) => {
          return n.consumption != null;
        }
      );
    }

    if (consumptions) {
      if (tibber.home.consumption) {
        consumptions.unshift(
          this.makeRemainingConsumption(
            tibberData.totalConsumption,
            consumptions
          )
        );
      }
      tibberData.consumptions = consumptions;
      // tibberData.consumptions = consumptions.filter(c => c.data.length > 0);
    }

    // console.log("Consumptions: ", JSON.stringify(consumptions, null, 2));
    this.sendSocketNotification("TIBBER_DATA", tibberData);
  },

  makeRemainingConsumption: function (total, parts) {
    const convertedTotal = {
      label: "Total",
      data: total.map((v) => {
        return {
          from: new Date(v.from),
          consumption: v.consumption,
          consumptionUnit: v.consumptionUnit
        };
      })
    };
    // console.log("convertedTotal = ", JSON.stringify(convertedTotal, null, 2));

    const convertedParts = parts
      .filter((p) => p)
      .map((p) => {
        // console.log("p: ", p);
        return {
          label: p.label,
          data: p.data.map((d) => {
            return {
              from: new Date(d.from),
              consumption: d.consumption,
              consumptionUnit: d.consumptionUnit
            };
          })
        };
      });
    // console.log("convertedParts = ", JSON.stringify(convertedParts, null, 2));

    const sumParts = function (arr, time) {
      // console.log("sumParts input: arr = ", arr, ", time = ", time);
      const res = arr.reduce((p, c) => {
        return (
          p +
          c.data
            .filter((v) => {
              return v.from.getTime() === time.getTime();
            })
            .reduce((p, v) => {
              return v.consumption;
            }, 0)
        );
      }, 0);
      return res;
    };

    const remaining = {
      label: "Other",
      data: convertedTotal.data.map((v) => {
        return {
          from: v.from,
          consumption: v.consumption - sumParts(convertedParts, v.from),
          consumptionUnit: v.consumptionUnit
        };
      })
    };

    // console.log("Remaining: ", remaining);
    return remaining;
  },

  receiveTibberSubscriptionData: function (subData) {
    // if (subData.type == "data") {
    this.sendSocketNotification("TIBBER_SUBSCRIPTION_DATA", subData);
    this.log("Tibber subscription data:", JSON.stringify(subData, null, 2));
    // }
  },

  stop: function () {
    tibberApi.close();
  },

  readConsumptions: function (config) {
    const promises = [];
    config.consumptionParts.forEach((c) => {
      if (c.type === "prometheus") {
        const cons = consumptions.prometheus(c);
        promises.push(cons);
      }
    });
    return Promise.all(promises);
  }
});
