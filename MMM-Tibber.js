"use strict";

Date.prototype.addHours = function(h) {
  this.setHours(this.getHours() + h);
  return this;
};

let powerTickPositions = [];

Module.register("MMM-Tibber", {
  getScripts: function() {
    return [
      "dom.js",
      "draw_tibber.js",
      "draw_power_gauge.js",
      this.file("node_modules/highcharts/highcharts.js"),
      this.file("node_modules/highcharts/highcharts-more.js"),
      this.file("node_modules/highcharts/modules/annotations.js"),
      this.file("node_modules/highcharts/modules/solid-gauge.js")
    ];
  },

  log: function(...args) {
    if (this.config.logging) {
      console.log(args);
    }
  },

  defaults: {
    // General
    tibberToken: "log in to tibber to find your token",
    houseNumber: 0, // If you have more than one Tibber subscription
    logging: false,
    historyHours: 24,
    futureHours: 48,
    // Chart
    xAxisLineColor: "#333333",
    xAxisLabelColor: "#999999",
    adjustMargins: {
      left: 0,
      right: 0,
      top: 0
    },
    // Price curve
    showPrice: true,
    priceChartType: "line", // column, line or spline
    priceLineWidth: 3, // For line and spline, not column
    priceColor: "#cc0000", // For line and spline
    priceColumnColors: {
      // Only for column chart type
      NORMAL: ["#000055", "#0000dd", "#000088"], // Blue
      VERY_CHEAP: ["#004400", "#00dd00", "#008800"], // Lighter green
      CHEAP: ["#003300", "#00bb00", "#006600"], // Green
      EXPENSIVE: ["#440000", "#cc0000", "#770000"], // Red
      VERY_EXPENSIVE: ["#440000", "#aa0000", "#550000"], // Darker red
      UNKNOWN: ["#444444", "#444444", "#444444"] // Gray
    },
    // Consumption curve
    showConsumption: true,
    consumptionChartType: "column", // column, line or spline
    consumptionLineWidth: 2, // For line and spline
    consumptionColor: "#ffcc00", // For line and spline
    consumptionDecimals: 1,
    // Price label and min/max price text
    priceUnit: "kr",
    decimalSeparator: ",",
    priceFontSize: 16,
    priceDecimals: 2,
    showCurrentPrice: true,
    curPriceColor: "#ff7733",
    // Min and Max price lines
    showMinPrice: true,
    showMaxPrice: true,
    minPriceLineWidth: 1,
    maxPriceLineWidth: 1,
    minPriceColor: "#00bb00",
    maxPriceColor: "#ee0000",
    adjustPriceLabelsX: 0, // Adjust position sideways in pixels (pos or neg)
    // Min/Max consumption labels
    showMinConsumption: true,
    showMaxConsumption: true,
    adjustConsumptionLabelsX: 0, // Adjust position sideways in pixels (pos or neg)
    additionalCosts: [
      {
        label: "Nettleie",
        unitPrice: 23.125
      },
      {
        label: "Forbruksavgift",
        unitPrice: 20.163
      }
    ],
    showAdditionalCosts: true,
    // Power gauge
    showPowerGauge: true,
    powerGauge: {
      maxPower: 12000, // Max gauge value
      markSize: 20, // Size of marks in % of sector area
      labelFontSize: 14,
      powerFontSize: 22,
      titleFontSize: 16,
      colors: [
        // Colors for the graph
        { fromValue: 0, color: "#00BB00" },
        { fromValue: 3000, color: "#0000BB" },
        { fromValue: 7000, color: "#BB0000" }
      ],
      minTickColor: "#00AA00",
      avgTickColor: "#0000AA",
      maxTickColor: "#AA0000",
      title: "Power (W)"
    }
  },

  start: function() {
    console.log(this.name + " started.");
    this.loaded = true;
    this.updateDom();
    this.sendSocketNotification("TIBBER_CONFIG", this.config);
  },

  interval: null,

  socketNotificationReceived: function(notification, payload) {
    if (payload == null) {
      console.log(self.name + ": " + notification + " - No payload");
      return;
    }
    if (notification === "TIBBER_SUBSCRIPTION_DATA") {
      this.log("Got sub data: ", payload);
      this.updateSubData(payload);
    } else if (notification === "TIBBER_DATA") {
      drawTibber(this.identifier, payload, this.config);
      clearInterval(this.interval);
      this.interval = setInterval(() => {
        drawTibber(this.identifier, payload, this.config);
      }, 30000);
    }
  },

  getStyles: function() {
    return ["MMM-Tibber.css"];
  },

  getDom: function() {
    setTimeout(() => {
      this.powerTickPositions = [0, 0, 0, 0, this.config.powerGauge.maxPower];
      this.gaugesDrawing = this.config.showPowerGauge
        ? drawPowerGauge(
            this.identifier,
            this.powerTickPositioner,
            this.config.powerGauge
          )
        : null;
    }, 100);

    return dom(
      this.identifier,
      this.config.showPrice || this.config.showConsumption,
      this.config.showPowerGauge
    );
  },

  showHour: function(hour, now) {
    return (
      hour >= now - this.config.historyHours &&
      hour <= now + this.config.futureHours
    );
  },

  updateSubData: function(subData) {
    this.gaugesDrawing && this.updatePowerGauge(subData);
  },

  updatePowerGauge: function(subData) {
    const consumptionChart = this.gaugesDrawing;
    const min1 = consumptionChart.series[0].points[0];
    const min2 = consumptionChart.series[1].points[0];
    const current = consumptionChart.series[2].points[0];
    const avg1 = consumptionChart.series[3].points[0];
    const avg2 = consumptionChart.series[4].points[0];
    const max1 = consumptionChart.series[5].points[0];
    const max2 = consumptionChart.series[6].points[0];
    const stepSize = 120;
    min1.update(subData.minPower - stepSize);
    min2.update(subData.minPower + stepSize);
    current.update({
      y: subData.power,
      color: this.getColor(this.config.powerGauge.colors, subData.power)
    });
    avg1.update(subData.averagePower - stepSize);
    avg2.update(subData.averagePower + stepSize);
    max1.update(subData.maxPower - stepSize);
    max2.update(subData.maxPower + stepSize);

    // Set dynamic tick positions
    powerTickPositions.splice(0, powerTickPositions.length);
    powerTickPositions.push(0);
    powerTickPositions.push(subData.minPower);
    powerTickPositions.push(subData.averagePower);
    powerTickPositions.push(subData.maxPower);
    powerTickPositions.push(this.config.powerGauge.maxPower);
    consumptionChart.yAxis[0].update();
  },

  powerTickPositioner: function() {
    return powerTickPositions;
  },

  getColor(colors, value) {
    // Find color from array based on value
    return colors.reduce((color, cur, i, arr) => {
      return value > cur.fromValue ? cur.color : color;
    }, colors[0].color);
  }
});
