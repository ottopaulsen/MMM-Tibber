"use strict";

Date.prototype.addHours = function (h) {
  this.setHours(this.getHours() + h);
  return this;
};

Module.register("MMM-Tibber", {
  getScripts: function () {
    return [
      "gauge_options.js",
      "dom.js",
      "draw-graphs.js",
      "tibber-data.js",
      "draw_power_gauge.js",
      "draw_voltage_gauge.js",
      "draw_current_gauge.js",
      this.file("node_modules/highcharts/highcharts.js"),
      this.file("node_modules/highcharts/highcharts-more.js"),
      this.file("node_modules/highcharts/modules/annotations.js"),
      this.file("node_modules/highcharts/modules/solid-gauge.js")
    ];
  },

  defaults: {
    // General
    tibberToken: "log in to tibber to find your token",
    houseNumber: 0, // If you have more than one Tibber subscription
    homeId: null,
    logging: false, // Turn on to see more details, but keep normally off
    is3phase: false, // Set to true to force 3-phase
    updateInterval: 5, // Tibber query update interval in minutes
    // Chart
    historyHours: 24, // How long history for price and consumption to see in the graph
    futureHours: 48, // How long into the future to see price data
    xAxisLineColor: "#333333",
    xAxisLabelColor: "#999999",
    adjustLeftMargin: 0, // Pixels to adjust margin
    adjustRightMargin: 0,
    adjustTopMargin: 0,
    graphWidth: null, // Uses available width by default
    graphHeight: 200,
    // Price curve
    showPrice: true,
    dynamicMin: null, // Set graph min to a dynamic value. 0 = minPrice, ex. 0.2 = 0.2 below min price
    priceChartType: "column", // column, line or spline
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
    // Savings curve
    showSavings: false,
    savingsChartType: "columnrange",
    savingsLineWidth: 3,
    savingsColor: "#b829e3",
    savingsTopic: "powersaver/plan",
    // Consumption curve
    showConsumption: true,
    consumptionChartType: "spline", // column, line or spline
    consumptionLineWidth: 2, // For line and spline
    consumptionColor: "#ffcc00", // For line and spline
    consumptionDecimals: 1,
    // Price label and min/max price text
    priceUnit: "kr",
    decimalSeparator: ",",
    graphLabelFontSize: 16,
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
    // Additional costs
    additionalCostPerKWH: [],
    showAdditionalCostsGraph: true,
    additionalCostsLabelColor: "#888888",
    additionalCostsLabelAdjustX: 0, // Adjust label position
    additionalCostsLabelAdjustY: 0, // Adjust label position
    includeAdditionalCostsInPrice: true,
    // Power gauge
    showPowerGauge: true,
    powerGaugeMaxValue: null, // Max gauge value. Calculated by default.
    powerGaugeMarkSize: 20, // Size of marks in % of sector area
    powerGaugeMinTickColor: "#00AA00",
    powerGaugeAvgTickColor: "#0000AA",
    powerGaugeMaxTickColor: "#AA0000",
    powerGaugeTitle: "",
    powerGaugeDynamicColors: true,
    orangePercentOfAvg: 120,
    redPowerPercentOfMax: 85,
    redPowerPercentOfAvg: 200,
    powerGaugeColors: [
      // Colors for the graph
      { fromValue: 0, color: "#00BB00" },
      { fromValue: 5000, color: "#e68a00" },
      { fromValue: 7000, color: "#BB0000" }
    ],
    // Voltage gauge
    showVoltageGauge: true,
    voltageGaugeName: "voltage",
    voltageGaugeTitle: "",
    voltageGaugeNominalValue: 230,
    voltageGaugeMaxValue: 255,
    voltageGaugeMinValue: 150,
    voltageGaugeColors: [
      // Colors for the graph
      { fromValue: 0, color: "#BB0000" },
      { fromValue: 207, color: "#0000BB" },
      { fromValue: 220, color: "#00BB00" },
      { fromValue: 240, color: "#0000BB" },
      { fromValue: 253, color: "#BB0000" }
    ],
    // Current gauge
    showCurrentGauge: true,
    currentGaugeName: "current",
    currentGaugeTitle: "",
    currentGaugeNominalValue: 63, // Main fuse
    currentGaugeMaxValue: 70,
    currentGaugeMinValue: 0,
    currentGaugeColors: [
      // Colors for the graph
      { fromValue: 0, color: "#00BB00" },
      { fromValue: 50, color: "#e68a00" },
      { fromValue: 61, color: "#BB0000" }
    ],
    // Gauges common
    gaugesVertical: false, // Set true to show gauges vertically
    gaugesAbove: true, // Set false to have gauges below the graph
    gaugesWidth: 230,
    gaugesHeight: 120,
    gaugesValueFontSize: 17,
    gaugesValueFontSize3phase: 14,
    gaugesValueDistanceAdjustment: 0,
    gaugesLabelFontSize: 12,
    gaugesTitleFontSize: 12,
    // Table data
    showTable: true,
    tableVertical: false,
    tableWidth: null,
    accumulatedPowerUnit: "kWh",
    accumulatedCostCurrency: "Kr",
    tableLabelColor: "#666666",
    tableValueColor: "#e6e600",
    // Consumption parts
    showConsumptionParts: true,
    consumptionParts: []
  },

  log: function (...args) {
    if (this.config.logging) {
      args.forEach((arg) => console.log(arg));
    }
  },

  getTranslations: function () {
    return {
      en: "translations/en.json",
      nb: "translations/nb.json",
      sv: "translations/sv.json",
      de: "translations/de.json"
    };
  },

  showGauges: function () {
    return (
      this.config.showPowerGauge ||
      this.config.showVoltageGauge ||
      this.config.showCurrentGauge
    );
  },

  start: function () {
    this.instanceId = this.config.homeId;
    this.powerTickPositions = [0, 0, 0, 0, this.config.powerGaugeMaxValue]; // Initialize here
    Log.info(this.name + " started. Home Id: " + this.config.homeId);

    // Set max power
    if (!this.config.powerGaugeMaxValue) {
      const max =
        this.config.voltageGaugeNominalValue *
        this.config.currentGaugeNominalValue;
      this.config.powerGaugeMaxValue = Math.floor((max + 1200) / 1000) * 1000;
      Log.info("Setting max power to " + this.config.powerGaugeMaxValue);
      Log.info("Translating CURRENT to " + this.translate("CURRENT"));
    }

    if (
      this.config.powerGaugeColors.length < 3 &&
      this.config.powerGaugeDynamicColors
    ) {
      Log.error(
        "powerGaugeDynamicColors must have 3 colors to use powerGaugeDynamicColors"
      );
      this.config.powerGaugeDynamicColors = false;
    }

    // Set table with = gauges width if vertical
    if (
      this.config.tableVertical &&
      this.config.showTable &&
      this.config.tableWidth == null &&
      this.config.gaugesVertical &&
      this.showGauges()
    ) {
      this.config.tableWidth = this.config.gaugesWidth;
    }

    this.loaded = true;
    this.updateDom();
    this.sendSocketNotification("TIBBER_CONFIG_" + this.instanceId, this.config);
  },

  interval: null,

  savingsData: [],

  socketNotificationReceived: function (notification, payload) {
    if (payload == null) {
      Log.warn(self.name + ": " + notification + " - No payload");
      return;
    }

    const subscription_prefix = "TIBBER_SUBSCRIPTION_DATA_";
    const data_prefix = "TIBBER_DATA_";

    if (notification.startsWith(subscription_prefix)) {
      const instanceId = notification.substring(subscription_prefix.length);
      if (instanceId === this.instanceId) {
        this.log("got subscription data for instance: " + instanceId + " current instance is: " + this.instanceId);
        this.updateSubData(payload);
      }
    } else if (notification.startsWith(data_prefix)) {
      const instanceId = notification.substring(data_prefix.length);
      if (instanceId === this.instanceId) {
        this.log("got usage data for instance: " + instanceId + " current instance is: " + this.instanceId);
        this.log("Got Tibber data: ");
        this.log(payload);
        const additionalCosts = this.sumAdditionalCosts(this.config);
        if (this.config.showConsumption || this.config.showPrice) {
          clearInterval(this.interval);
          drawGraphs(
            this.identifier,
            new TibberData(payload),
            this.config,
            additionalCosts,
            this.savingsData
          );
          this.interval = setInterval(() => {
            drawGraphs(
              this.identifier,
              new TibberData(payload),
              this.config,
              additionalCosts,
              this.savingsData
            );
          }, 30000);
        }
      }
    }
  },

  getStyles: function () {
    return ["MMM-Tibber.css"];
  },

  getDom: function () {
    setTimeout(() => {
      this.powerDrawing = this.config.showPowerGauge
        ? drawPowerGauge(
            this.identifier,
            () => this.powerTickPositions,
            this.config,
            gaugeOptions(this.config),
            (word) => {
              return this.translate(word);
            }
          )
        : null;
      this.voltageDrawing = this.config.showVoltageGauge
        ? drawVoltageGauge(
            this.identifier,
            this.config,
            gaugeOptions(this.config),
            this.is3phase(),
            (word) => {
              return this.translate(word);
            }
          )
        : null;
      this.currentDrawing = this.config.showCurrentGauge
        ? drawCurrentGauge(
            this.identifier,
            this.config,
            gaugeOptions(this.config),
            this.is3phase(),
            (word) => {
              return this.translate(word);
            }
          )
        : null;
    }, 500);

    return dom(this.identifier, this.config, (word) => {
      return this.translate(word);
    });
  },

  showHour: function (hour, now) {
    return (
      hour >= now - this.config.historyHours &&
      hour <= now + this.config.futureHours
    );
  },

  updateSubData: function (subData) {
    this.powerDrawing && this.updatePowerGauge(subData);
    this.voltageDrawing && this.updateVoltageGauge(subData);
    this.currentDrawing && this.updateCurrentGauge(subData);
    this.config.showTable && this.updateTable(subData);
  },

  maxPowerWarningLogged: false,

  updatePowerGauge: function (subData) {
    const gauge = this.powerDrawing;
    const min1 = gauge.series[0].points[0];
    const min2 = gauge.series[1].points[0];
    const current = gauge.series[2].points[0];
    const avg1 = gauge.series[3].points[0];
    const avg2 = gauge.series[4].points[0];
    const max1 = gauge.series[5].points[0];
    const max2 = gauge.series[6].points[0];
    const stepSize = 120;
    min1.update(subData.minPower - stepSize);
    min2.update(subData.minPower + stepSize);
    const redPower = Math.min(
      (subData.maxPower * this.config.redPowerPercentOfMax) / 100,
      (subData.averagePower * this.config.redPowerPercentOfAvg) / 100
    );
    const dynamicColorIndex =
      subData.power <
      (subData.averagePower * this.config.orangePercentOfAvg) / 100
        ? 0
        : subData.power < redPower
        ? 1
        : 2;
    const color = this.config.powerGaugeDynamicColors
      ? this.config.powerGaugeColors[dynamicColorIndex].color
      : this.getColor(this.config.powerGaugeColors, subData.power);
    current.update({
      y: subData.power,
      color: color
    });
    avg1.update(subData.averagePower - stepSize);
    avg2.update(subData.averagePower + stepSize);
    max1.update(subData.maxPower - stepSize);
    max2.update(subData.maxPower + stepSize);

    if (
      subData.maxPower > this.config.powerGaugeMaxValue &&
      !this.maxPowerWarningLogged
    ) {
      this.maxPowerWarningLogged = true;
      Log.error(
        "Actual max power (" +
          subData.maxPower +
          ") larger than configured max power (" +
          this.powerDrawing.yAxis[0].max +
          ")"
      );
    }

    // Set dynamic tick positions
    this.powerTickPositions.splice(0, this.powerTickPositions.length);
    this.powerTickPositions.push(0);
    this.powerTickPositions.push(subData.minPower);
    this.powerTickPositions.push(subData.averagePower);
    this.powerTickPositions.push(subData.maxPower);
    this.powerTickPositions.push(this.config.powerGaugeMaxValue);
    gauge.yAxis[0].update();
  },

  v1: null,
  v2: null,
  v3: null,

  is3phase: function () {
    return this.config.is3phase || !!this.v3 || !!this.c3;
  },

  updateVoltageGauge: function (subData) {
    if (!this.v1 && subData.voltagePhase1) {
      // First time voltage received. Draw again to get right number of phases.
      this.voltageDrawing = this.config.showVoltageGauge
        ? drawVoltageGauge(
            this.identifier,
            this.config,
            gaugeOptions(this.config),
            this.is3phase(),
            (word) => {
              return this.translate(word);
            }
          )
        : null;
    }
    this.v1 = subData.voltagePhase1 || this.v1;
    this.v2 = subData.voltagePhase2 || this.v2;
    this.v3 = subData.voltagePhase3 || this.v3;
    const gauge = this.voltageDrawing;
    const phase1 = gauge.series[0].points[0];
    const phase2 = gauge.series[1].points[0];
    const phase3 = gauge.series[2].points[0];
    this.v1 &&
      phase1.update({
        y: Math.round(this.v1),
        color: this.getColor(this.config.voltageGaugeColors, this.v1)
      });
    this.v2 &&
      phase2.update({
        y: Math.round(this.v2),
        color: this.getColor(this.config.voltageGaugeColors, this.v2)
      });
    this.v3 &&
      phase3.update({
        y: Math.round(this.v3),
        color: this.getColor(this.config.voltageGaugeColors, this.v3)
      });
  },

  c1: null,
  c2: null,
  c3: null,

  updateCurrentGauge: function (subData) {
    if (!this.c1 && subData.currentL1) {
      // First time curent received. Draw again to get right number of phases.
      this.currentDrawing = this.config.showCurrentGauge
        ? drawCurrentGauge(
            this.identifier,
            this.config,
            gaugeOptions(this.config),
            this.is3phase(),
            (word) => {
              return this.translate(word);
            }
          )
        : null;
    }
    this.c1 = subData.currentL1 || this.c1;
    this.c2 = subData.currentL2 || this.c2;
    this.c3 = subData.currentL3 || this.c3;
    const gauge = this.currentDrawing;
    const phase1 = gauge.series[0].points[0];
    const phase2 = gauge.series[1].points[0];
    const phase3 = gauge.series[2].points[0];
    this.c1 &&
      phase1.update({
        y: Math.round(this.c1),
        color: this.getColor(this.config.currentGaugeColors, this.c1)
      });
    this.c2 &&
      phase2.update({
        y: Math.round(this.c2),
        color: this.getColor(this.config.currentGaugeColors, this.c2)
      });
    this.c3 &&
      phase3.update({
        y: Math.round(this.c3),
        color: this.getColor(this.config.currentGaugeColors, this.c3)
      });
  },

  updateTable: function (subData) {
    // Accumulated power
    const accumulatedPower = document.getElementById(
      "acc-power-" + this.identifier + "-value"
    );
    accumulatedPower.innerHTML = Math.round(subData.accumulatedConsumption);

    const accumulatedPowerUnit = document.getElementById(
      "acc-power-" + this.identifier + "-unit"
    );
    accumulatedPowerUnit.innerHTML = this.config.accumulatedPowerUnit;

    // Accumulated cost
    const accumulatedCost = document.getElementById(
      "acc-cost-" + this.identifier + "-value"
    );
    accumulatedCost.innerHTML = Math.round(
      subData.accumulatedCost +
        (this.config.includeAdditionalCostsInPrice
          ? this.sumAdditionalCosts(this.config) *
            subData.accumulatedConsumption
          : 0)
    );

    const accumulatedCostUnit = document.getElementById(
      "acc-cost-" + this.identifier + "-unit"
    );
    accumulatedCostUnit.innerHTML =
      this.config.accumulatedCostCurrency || subData.currency;
  },

  getColor(colors, value) {
    // Find color from array based on value
    return colors.reduce((color, cur) => {
      return value > cur.fromValue ? cur.color : color;
    }, colors[0].color);
  },

  sumAdditionalCosts(config) {
    return config.additionalCostPerKWH.reduce((sum, a) => {
      return sum + a.price;
    }, 0);
  }
});
