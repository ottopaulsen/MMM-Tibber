"use strict";

const NodeHelper = require("node_helper");
const tibber = require("./tibber");

module.exports = NodeHelper.create({
  start: function() {
    console.log(this.name + ": Starting node helper");
    this.loaded = false;
  },

  log: function(...args) {
    if (this.config.logging) {
      console.log(args);
    }
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === "TIBBER_CONFIG") {
      var config = payload;
      this.config = config;
      this.loaded = true;
      let self = this;

      this.readTibberData(config);
      setInterval(function() {
        self.readTibberData(config);
      }, 1000 * 60 * 5); // Every 5 minutes
    }
  },

  readTibberData: function(config) {
    this.log("readTibberData");
    let tibberData = {
      consumption: [],
      prices: {
        current: null,
        twoDays: []
      }
    };
    tibber
      .getTibber(config.tibberToken, config.houseNumber, config.historyHours)
      .then(res => {
        this.log("Tibber data: ", res);
        tibberData.prices.current = res.currentSubscription.priceInfo.current;
        tibberData.prices.twoDays = res.currentSubscription.priceInfo.today.concat(
          res.currentSubscription.priceInfo.tomorrow
        );
        if (res.consumption) {
          tibberData.consumption = res.consumption.nodes.filter(n => {
            return n.consumption != null;
          });
        }
        this.sendSocketNotification("TIBBER_DATA", tibberData);
      })
      .catch(e => {
        console.log("Error getting tibber prices: ", e);
      });
  }
});
