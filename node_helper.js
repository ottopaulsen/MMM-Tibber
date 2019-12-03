"use strict";

const NodeHelper = require("node_helper");
const tibber = require("./tibber");

module.exports = NodeHelper.create({

    start: function () {
        console.log(this.name + ': Starting node helper');
        this.loaded = false;
    },

    log: function (...args) {
        if (this.config.logging) {
            console.log(args);
        }
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === 'TIBBER_CONFIG') {
            var config = payload;
            this.config = config;
            this.loaded = true;
            let self = this;

            this.readTibberPrices(config);
            setInterval(function () {
                self.readTibberPrices(config);
            }, 1000 * 60 * 60); // Every hour
        }
    },

    readTibberPrices: function (config) {
        log("readTibberPrices")
        let prices = {
            current: null,
            twoDays: []
        }
        tibber.getPrices(config.tibberToken)
        .then(res => {
            prices.current = res.current.total;
            prices.twoDays = res.today;
            prices.twoDays = res.today.concat(res.tomorrow);
            this.log("Tibber prices: ", prices);
            this.sendSocketNotification('TIBBER_PRICE_DATA', prices);
        })
        .catch(e => {
            console.log('Error getting tibber prices: ', e)
        })

    }
});
