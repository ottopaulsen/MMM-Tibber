"use strict";

const NodeHelper = require("node_helper");
const consumptions = require("./consumptions");
const tibber = require("./tibber");

module.exports = NodeHelper.create({
  start: function () {
    console.log(this.name + ": Starting node helper");
    this.instances = {}; // Store state for each instance
  },

  log: function (instanceId, message) {
    if (this.instances[instanceId] && this.instances[instanceId].config.logging) {
      console.log(this.name + ": " + message);
    }
  },

  socketNotificationReceived: async function (notification, payload) {
    // Extract instanceId from the notification string formatted as "TIBBER_CONFIG_" + instanceId
    const prefix = "TIBBER_CONFIG_";
    if (notification.indexOf(prefix) === 0) {
      const instanceId = notification.substring(prefix.length);

      // check if the instance needs to be configured
      if (!this.instances[instanceId]) {
        this.instances[instanceId] = { loaded: false };

        console.log(this.name + ": Configuring instance " + instanceId);
        this.instances[instanceId].config = payload;

        if (!payload.homeId) {
          console.error(this.name + ": You must configure homeId for instance " + instanceId);
          console.log(this.name + ": You can run 'node get-homes.js <token>' in the module folder, or go to https://developer.tibber.com/ to find your homeId");
          return;
        }

        this.instances[instanceId].loaded = true;
        console.log(this.name + ": Tibber update interval for instance " + instanceId + ": " + payload.updateInterval + " minutes");

        this.instances[instanceId].tibberApi = await tibber(payload.tibberToken);
        this.instances[instanceId].tibberApi.subscribe(payload.homeId, this.receiveTibberSubscriptionData.bind(this, instanceId));

        this.handleTibber(instanceId, payload);
        setInterval(() => {
          this.handleTibber(instanceId, payload);
        }, 1000 * 60 * payload.updateInterval);
      }
    }
  },

  handleTibber: function (instanceId, config) {
    const consumptions = this.readConsumptions(config);
    const tibberData = this.readTibberData(instanceId, config);
    Promise.all([consumptions, tibberData])
      .then((results) => {
        this.sendChartData(instanceId, results[0].filter((r) => r.data.length > 0), results[1]);
      })
      .catch((e) => {
        console.log("Error in instance " + instanceId + ": ", e);
      });
  },

  readTibberData: async function (instanceId, config) {
    return await this.instances[instanceId].tibberApi.perHour(config.homeId, config.historyHours);
  },

  sendChartData: function (instanceId, consumptions, tibber) {
    this.log(instanceId, "Tibber data: ");
    this.log(instanceId, JSON.stringify(tibber, null, 2));

    this.log(instanceId, "Consumption parts: ");
    this.log(instanceId, JSON.stringify(consumptions, null, 2));

    const tibberData = {
      consumption: [],
      prices: {
        current: null,
        twoDays: []
      }
    };
    tibberData.prices.current = tibber.home.currentSubscription.priceInfo.current;
    tibberData.prices.twoDays = tibber.home.currentSubscription.priceInfo.today.concat(tibber.home.currentSubscription.priceInfo.tomorrow);

    if (tibber.home.consumption) {
      tibberData.totalConsumption = tibber.home.consumption.nodes.filter((n) => n.consumption != null);
    }

    if (consumptions) {
      if (tibber.home.consumption) {
        consumptions.unshift(this.makeRemainingConsumption(tibberData.totalConsumption, consumptions));
      }
      tibberData.consumptions = consumptions;
    }

    this.sendSocketNotification("TIBBER_DATA_" + instanceId, tibberData);
  },

  makeRemainingConsumption: function (total, parts) {
    const convertedTotal = {
      label: "Total",
      data: total.map((v) => ({
        from: new Date(v.from),
        consumption: v.consumption,
        consumptionUnit: v.consumptionUnit
      }))
    };

    const convertedParts = parts.filter((p) => p).map((p) => ({
      label: p.label,
      data: p.data.map((d) => ({
        from: new Date(d.from),
        consumption: d.consumption,
        consumptionUnit: d.consumptionUnit
      }))
    }));

    const sumParts = (arr, time) => arr.reduce((p, c) => p + c.data.filter((v) => v.from.getTime() === time.getTime()).reduce((p, v) => v.consumption, 0), 0);

    const remaining = {
      label: "Other",
      data: convertedTotal.data.map((v) => ({
        from: v.from,
        consumption: v.consumption - sumParts(convertedParts, v.from),
        consumptionUnit: v.consumptionUnit
      }))
    };

    return remaining;
  },

  receiveTibberSubscriptionData: function (instanceId, subData) {
    this.sendSocketNotification("TIBBER_SUBSCRIPTION_DATA_" + instanceId, subData);
    this.log(instanceId, "Tibber subscription data: " + JSON.stringify(subData, null, 2));
  },

  stop: function () {
    Object.values(this.instances).forEach(instance => {
      if (instance.tibberApi) {
        instance.tibberApi.close();
      }
    });
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
