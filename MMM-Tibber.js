"use strict";

Date.prototype.addHours = function(h) {
  this.setHours(this.getHours() + h);
  return this;
};

Module.register("MMM-Tibber", {
  getScripts: function() {
    return [
      this.file("node_modules/highcharts/highcharts.js"),
      this.file("node_modules/highcharts/modules/annotations.js")
    ];
  },

  log: function(...args) {
    if (this.config.logging) {
      console.log(args);
    }
  },

  // Default module config
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
    adjustConsumptionLabelsX: 0 // Adjust position sideways in pixels (pos or neg)
  },

  start: function() {
    console.log(this.name + " started.");
    this.loaded = true;
    this.updateDom();
    this.sendSocketNotification("TIBBER_CONFIG", this.config);
  },

  interval: null,

  socketNotificationReceived: function(notification, payload) {
    var self = this;
    if (notification === "TIBBER_DATA") {
      if (payload != null) {
        this.drawTibber(payload);
        clearInterval(this.interval);
        this.interval = setInterval(() => {
          this.drawTibber(payload);
        }, 30000);
      } else {
        console.log(self.name + ": TIBBER_DATA - No payload");
      }
    }
  },

  getStyles: function() {
    return ["MMM-Tibber.css"];
  },

  getDom: function() {
    self = this;
    const wrapper = document.createElement("div");

    // Tibber chart
    const tibberChart = document.createElement("div");
    tibberChart.setAttribute("id", "tibberdata");
    tibberChart.setAttribute("style", "width:700px; height:200px;");

    const tekst = document.createElement("p");
    tekst.innerHTML = "No Tibber data";
    tibberChart.appendChild(tekst);

    wrapper.appendChild(tibberChart);
    return wrapper;
  },

  showHour: function(hour, now) {
    return (
      hour >= now - this.config.historyHours &&
      hour <= now + this.config.futureHours
    );
  },

  getMinPrice: function(prices) {
    return prices.reduce((min, p) => (p.y < min ? p.y : min), prices[0].y);
  },

  getMaxPrice: function(prices) {
    return prices.reduce((max, p) => (p.y > max ? p.y : max), prices[0].y);
  },

  getMinConsumption(consumption) {
    return consumption.reduce(
      (min, c) => (c.consumption < min ? c.consumption : min),
      consumption[0] ? consumption[0].consumption : null
    );
  },

  getMaxConsumption(consumption) {
    return consumption.reduce(
      (max, c) => (c.consumption > max ? c.consumption : max),
      consumption[0] ? consumption[0].consumption : null
    );
  },

  drawTibber: function(tibberData) {
    const consumption = tibberData.consumption;
    const prices = tibberData.prices;

    const showFromTime = new Date().addHours(-this.config.historyHours - 1);
    const showToTime = new Date().addHours(this.config.futureHours);

    const minConsumption = this.getMinConsumption(consumption);
    const maxConsumption = this.getMaxConsumption(consumption);
    const consumptionUnit = tibberData.consumption[0]
      ? tibberData.consumption[0].consumptionUnit
      : "";

    const firstPriceTime = prices.twoDays[0].startsAt;
    const priceData = this.extractPriceDataFromConsumption(
      consumption,
      firstPriceTime
    )
      .concat(this.extractPriceDataFromPrices(prices))
      .filter(p => {
        return p.x >= showFromTime && p.x <= showToTime;
      });

    const minPrice = this.getMinPrice(priceData);
    const maxPrice = this.getMaxPrice(priceData);

    let curPriceBackgroundColor;
    const curPrice = prices.current.total;

    const consumptionData = this.extractConsumptionData(
      consumption,
      minConsumption,
      maxConsumption
    );

    this.log("Consumption: ", consumptionData);

    // Show time in local timezone
    Highcharts.setOptions({
      time: {
        useUTC: false
      }
    });

    Highcharts.chart("tibberdata", {
      chart: {
        zoomType: "xy",
        backgroundColor: "#000000",
        marginTop: 10 + this.config.adjustMargins.top,
        marginLeft: 80 + this.config.adjustMargins.left,
        marginRight: 60 + this.config.adjustMargins.right
      },
      title: {
        text: ""
      },
      xAxis: {
        type: "datetime",
        labels: {
          style: {
            color: this.config.xAxisLabelColor
          }
        },
        lineColor: this.config.xAxisLineColor
      },
      yAxis: [
        {
          // Primary yAxis (price, left)
          startOnTick: false,
          title: {
            text: ""
          },
          gridLineColor: "#000000",
          labels: {
            style: {
              color: "#000000"
            }
          },
          min: 0,
          max: Math.ceil(maxPrice * 10) / 10,
          plotLines: [
            {
              // Min price line
              color: this.config.minPriceColor,
              width: this.config.showMinPrice
                ? this.config.minPriceLineWidth
                : 0,
              value: minPrice,
              zIndex: 9,
              label: {
                text: this.config.showMinPrice
                  ? this.formatNumber(minPrice, this.config.priceDecimals) +
                    " " +
                    this.config.priceUnit
                  : "",
                align: "right",
                verticalAlign: "top",
                style: {
                  color: this.config.minPriceColor,
                  fontSize: this.config.priceFontSize
                },
                x: 57 + this.config.adjustPriceLabelsX,
                y: 5
              }
            },
            {
              // Max price line
              color: this.config.maxPriceColor,
              width: this.config.showMaxPrice
                ? this.config.maxPriceLineWidth
                : 0,
              value: maxPrice,
              zIndex: 9,
              label: {
                text: this.config.showMaxPrice
                  ? this.formatNumber(maxPrice, this.config.priceDecimals) +
                    " " +
                    this.config.priceUnit
                  : "",
                align: "right",
                verticalAlign: "top",
                style: {
                  color: this.config.maxPriceColor,
                  fontSize: this.config.priceFontSize
                },
                x: 57 + this.config.adjustPriceLabelsX,
                y: 5
              }
            }
          ]
        },
        {
          // Secondary yAxis (consumption, right)
          title: {
            text: "Consumption",
            style: {
              color: "#000000"
            }
          },
          labels: {
            format: "{value} kWh",
            style: {
              color: "#000000"
            }
          },
          gridLineColor: "#000000",
          min: 0,
          max: Math.ceil(maxConsumption),
          opposite: true
        }
      ],
      legend: {
        enabled: false
      },
      plotOptions: {
        column: {
          pointPadding: 0.0,
          groupPadding: 0.0,
          borderWidth: 0
        },
        series: {
          animation: false
        }
      },
      series: [
        this.config.showPrice
          ? {
              name: "Strømpris",
              type: this.config.priceChartType,
              step: "center",
              color: this.config.priceColor,
              zIndex: this.config.priceChartType === "column" ? 5 : 7,
              lineWidth: this.config.priceLineWidth,
              marker: {
                enabled: false
              },
              data: priceData
            }
          : {},
        this.config.showConsumption
          ? {
              name: "Forbruk",
              type: this.config.consumptionChartType,
              zIndex: this.config.consumptionChartType === "column" ? 5 : 7,
              step: "center",
              color: this.config.consumptionColor,
              lineWidth: this.config.consumptionLineWidth,
              marker: {
                enabled: false
              },
              yAxis: 1,
              data: consumptionData
            }
          : {}
      ],
      annotations: [
        {
          labels: [
            {
              // Current price
              point: this.config.showCurrentPrice ? "cur" : "dontshow",
              text:
                this.formatNumber(curPrice, this.config.priceDecimals) +
                " " +
                this.config.priceUnit,
              backgroundColor: curPriceBackgroundColor,
              borderColor: this.config.curPriceColor,
              y: -10,
              style: {
                color: this.config.curPriceColor,
                fontSize: this.config.priceFontSize
              },
              zIndex: 15
            },
            {
              // Min consumption
              point: this.config.showMinConsumption
                ? {
                    x: -80 + this.config.adjustConsumptionLabelsX,
                    y: minConsumption,
                    yAxis: 1
                  }
                : "dontshow",
              text:
                this.formatNumber(
                  minConsumption,
                  this.config.consumptionDecimals
                ) +
                " " +
                consumptionUnit,
              backgroundColor: "#000",
              borderColor: "#000",
              y: 0,
              align: "left",
              verticalAlign: "middle",
              crop: false,
              overflow: "none",
              style: {
                color: this.config.consumptionColor,
                fontSize: this.config.priceFontSize
              }
            },
            {
              // Max consumption
              point: this.config.showMaxConsumption
                ? {
                    x: -80 + this.config.adjustConsumptionLabelsX,
                    y: maxConsumption,
                    yAxis: 1
                  }
                : "dontshow",
              text:
                this.formatNumber(
                  maxConsumption,
                  this.config.consumptionDecimals
                ) +
                " " +
                consumptionUnit,
              backgroundColor: "#000",
              borderColor: "#000",
              y: 0,
              align: "left",
              verticalAlign: "middle",
              crop: false,
              overflow: "none",
              style: {
                color: this.config.consumptionColor,
                fontSize: this.config.priceFontSize
              }
            }
          ]
        }
      ],
      credits: {
        enabled: false
      }
    });
  },

  formatNumber: function(n, d) {
    // Set number of decimals (d)
    if (n == null) {
      return "";
    }
    const x = Math.floor(n);
    const y = Math.round((n - x) * Math.pow(10, d), 0);
    return "" + x + this.config.decimalSeparator + y;
  },

  extractPriceDataFromConsumption: function(consumption, untilTime) {
    return consumption
      .filter(c => {
        return c.to <= untilTime;
      })
      .map(c => {
        return {
          x: Date.parse(c.from),
          y: c.unitPrice,
          color: this.config.priceColumnColors["UNKNOWN"][0],
          id: ""
        };
      });
  },

  extractPriceDataFromPrices: function(prices) {
    return prices.twoDays.map(p => {
      const now = Date.parse(prices.current.startsAt);
      const t = Date.parse(p.startsAt);
      const ci = t < now ? 0 : t === now ? 1 : 2;
      return {
        x: t,
        y: p.total,
        color: this.config.priceColumnColors[p.level][ci],
        id: t === now ? "cur" : ""
      };
    });
  },

  extractConsumptionData: function(
    consumption,
    minConsumption,
    maxConsumption
  ) {
    return consumption.map(c => {
      let t = Date.parse(c.from);
      return {
        x: t,
        y: c.consumption,
        id:
          c.consumption === maxConsumption
            ? "maxCon"
            : c.consumption === minConsumption
            ? "minCon"
            : ""
      };
    });
  }
});
