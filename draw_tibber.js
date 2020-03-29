"use strict";

function drawTibber(moduleId, tibberData, config) {
  const getMinPrice = function(prices) {
    return prices.reduce((min, p) => (p.y < min ? p.y : min), prices[0].y);
  };

  const getMaxPrice = function(prices) {
    return prices.reduce((max, p) => (p.y > max ? p.y : max), prices[0].y);
  };

  const getMinConsumption = function(consumption) {
    return consumption.reduce(
      (min, c) => (c.consumption < min ? c.consumption : min),
      consumption[0] ? consumption[0].consumption : null
    );
  };

  const getMaxConsumption = function(consumption) {
    return consumption.reduce(
      (max, c) => (c.consumption > max ? c.consumption : max),
      consumption[0] ? consumption[0].consumption : null
    );
  };

  const extractPriceDataFromPrices = function(prices, config) {
    return prices.twoDays.map((p, i, arr) => {
      const last = arr.length - 1;
      const now = Date.parse(prices.current.startsAt);
      const t = Date.parse(p.startsAt);
      const ci = t < now ? 0 : t === now ? 1 : 2;
      return {
        x: t,
        y: p.total,
        color: config.priceColumnColors[p.level][ci],
        id: t === now ? "cur" : i == last ? "last" : ""
      };
    });
  };

  const extractConsumptionData = function(
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
  };

  const extractPriceDataFromConsumption = function(
    consumption,
    untilTime,
    config
  ) {
    return consumption
      .filter(c => {
        return c.to <= untilTime;
      })
      .map(c => {
        return {
          x: Date.parse(c.from),
          y: c.unitPrice,
          color: config.priceColumnColors["UNKNOWN"][0],
          id: ""
        };
      });
  };

  const makeAdditionalPriceData = function(name, priceData, price) {
    return priceData.map(d => {
      return {
        x: d.x,
        y: price,
        color: d.color,
        id: d.id ? d.id + name : ""
      };
    });
  };

  const formatNumber = function(n, d, decimalSeparator) {
    // Set number of decimals (d)
    if (n == null) {
      return "";
    }
    const exp = Math.pow(10, d);
    const i = Math.round(n * exp);
    const x = Math.floor(i / exp);
    const y = "" + (i / exp - x);
    return "" + x + decimalSeparator + y.substr(2, d).padEnd(d, "0");
  };

  const consumption = tibberData.consumption;
  const prices = tibberData.prices;
  const includeAdditional = config.includeAdditionalCostsInPrice;
  const showFromTime = new Date().addHours(-config.historyHours - 1);
  const showToTime = new Date().addHours(config.futureHours);
  const minConsumption = getMinConsumption(consumption);
  const maxConsumption = getMaxConsumption(consumption);
  const consumptionUnit = tibberData.consumption[0]
    ? tibberData.consumption[0].consumptionUnit
    : "";
  const firstPriceTime = prices.twoDays[0].startsAt;
  const priceData = extractPriceDataFromConsumption(
    consumption,
    firstPriceTime,
    config
  )
    .concat(extractPriceDataFromPrices(prices, config))
    .filter(p => {
      return p.x >= showFromTime && p.x <= showToTime;
    });

  const sumAdditional = sumAdditionalCosts(config);
  const minPrice =
    getMinPrice(priceData) + (includeAdditional ? sumAdditional : 0);
  const maxPrice =
    getMaxPrice(priceData) + (includeAdditional ? sumAdditional : 0);

  const curPrice =
    prices.current.total + (includeAdditional ? sumAdditional : 0);

  const consumptionData = extractConsumptionData(
    consumption,
    minConsumption,
    maxConsumption
  );

  const seriesPrice = function(config, priceData) {
    return {
      name: "Powerprice",
      type: config.priceChartType,
      stack: 1,
      step: "center",
      color: config.priceColor,
      zIndex: config.priceChartType === "column" ? 5 : 7,
      lineWidth: config.priceLineWidth,
      marker: {
        enabled: false
      },
      data: priceData
    };
  };

  const seriesAdditionalCosts = function(config, priceData) {
    const res = [];
    let opacity = 1;
    config.additionalCostPerKWH.forEach(a => {
      opacity = opacity * 0.8;
      res.push({
        name: a.label,
        type: config.priceChartType,
        stack: 1,
        opacity: opacity,
        step: "center",
        zIndex: config.priceChartType === "column" ? 5 : 7,
        lineWidth: config.priceLineWidth,
        marker: {
          enabled: false
        },
        data: makeAdditionalPriceData(a.label, priceData, a.price)
      });
    });
    return res;
  };

  const seriesConsumption = function(config, consumptionData) {
    return {
      name: "Consumption",
      type: config.consumptionChartType,
      zIndex: config.consumptionChartType === "column" ? 5 : 7,
      step: "center",
      color: config.consumptionColor,
      lineWidth: config.consumptionLineWidth,
      marker: {
        enabled: false
      },
      yAxis: 1,
      data: consumptionData
    };
  };

  const series = [];
  config.showPrice && series.push(seriesPrice(config, priceData));
  config.showAdditionalCostsGraph &&
    series.push(...seriesAdditionalCosts(config, priceData));
  config.showConsumption &&
    series.push(seriesConsumption(config, consumptionData));

  const annotationsLabelsCurrentPrice = function(config, curPrice) {
    return {
      // Current price
      point: config.showCurrentPrice ? "cur" : "dontshow",
      text:
        formatNumber(curPrice, config.priceDecimals, config.decimalSeparator) +
        " " +
        config.priceUnit,
      backgroundColor: null,
      borderColor: config.curPriceColor,
      y: -10,
      style: {
        color: config.curPriceColor,
        fontSize: config.graphLabelFontSize
      },
      zIndex: 15
    };
  };

  const annotationsLabelsMinConsumption = function(config, minConsumption) {
    return {
      // Min consumption
      point: config.showMinConsumption
        ? {
            x: -80 + config.adjustConsumptionLabelsX,
            y: minConsumption,
            yAxis: 1
          }
        : "dontshow",
      text:
        formatNumber(
          minConsumption,
          config.consumptionDecimals,
          config.decimalSeparator
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
        color: config.consumptionColor,
        fontSize: config.graphLabelFontSize
      }
    };
  };

  const annotationsLabelsMaxConsumption = function(config, maxConsumption) {
    return {
      // Max consumption
      point: config.showMaxConsumption
        ? {
            x: -80 + config.adjustConsumptionLabelsX,
            y: maxConsumption,
            yAxis: 1
          }
        : "dontshow",
      text:
        formatNumber(
          maxConsumption,
          config.consumptionDecimals,
          config.decimalSeparator
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
        color: config.consumptionColor,
        fontSize: config.graphLabelFontSize
      }
    };
  };

  const annotationsLabelsAdditionalCosts = function(config) {
    // Additional costs
    return config.additionalCostPerKWH.map(a => {
      return {
        point: "last" + a.label,
        text:
          a.label +
          " " +
          formatNumber(a.price, config.priceDecimals, config.decimalSeparator) +
          " " +
          config.priceUnit,
        backgroundColor: null,
        borderColor: null,
        y: 0 + config.additionalCostsLabelAdjustX,
        x: 10 + config.additionalCostsLabelAdjustX,
        align: "right",
        verticalAlign: "top",
        crop: false,
        overflow: "none",
        style: {
          color: config.additionalCostsLabelColor,
          fontSize: config.graphLabelFontSize
        }
      };
    });
  };

  const annotationsLabels = [];
  annotationsLabels.push(annotationsLabelsCurrentPrice(config, curPrice));
  annotationsLabels.push(
    annotationsLabelsMinConsumption(config, minConsumption)
  );
  annotationsLabels.push(
    annotationsLabelsMaxConsumption(config, maxConsumption)
  );
  config.showAdditionalCostsGraph &&
    annotationsLabels.push(...annotationsLabelsAdditionalCosts(config));

  // Show time in local timezone
  Highcharts.setOptions({
    time: {
      useUTC: false
    }
  });

  console.log("Min price = " + minPrice + " (" + config.showMinPrice + ")");
  console.log("Max price = " + maxPrice + " (" + config.showMaxPrice + ")");

  Highcharts.chart("tibberdata-" + moduleId, {
    chart: {
      backgroundColor: "#000000",
      marginTop: 10 + config.adjustTopMargin,
      marginLeft: 80 + config.adjustLeftMargin,
      marginRight: 60 + config.adjustRightMargin
    },
    title: {
      text: ""
    },
    xAxis: {
      type: "datetime",
      labels: {
        style: {
          color: config.xAxisLabelColor
        }
      },
      lineColor: config.xAxisLineColor
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
        // max: Math.ceil(maxPrice * 10) / 10 + 1,
        plotLines: [
          {
            // Min price line
            color: config.minPriceColor,
            width: config.showMinPrice ? config.minPriceLineWidth : 0,
            value:
              minPrice -
              (config.showAdditionalCostsGraph
                ? 0
                : config.includeAdditionalCostsInPrice
                ? sumAdditionalCosts(config)
                : 0),
            zIndex: 9,
            label: {
              text: config.showMinPrice
                ? formatNumber(
                    minPrice,
                    config.priceDecimals,
                    config.decimalSeparator
                  ) +
                  " " +
                  config.priceUnit
                : "",
              align: "right",
              verticalAlign: "top",
              style: {
                color: config.minPriceColor,
                fontSize: config.graphLabelFontSize
              },
              x: 57 + config.adjustPriceLabelsX,
              y: 13
            }
          },
          {
            // Max price line
            color: config.maxPriceColor,
            width: config.showMaxPrice ? config.maxPriceLineWidth : 0,
            value:
              maxPrice -
              (config.showAdditionalCostsGraph
                ? 0
                : config.includeAdditionalCostsInPrice
                ? sumAdditionalCosts(config)
                : 0),
            zIndex: 9,
            label: {
              text: config.showMaxPrice
                ? formatNumber(
                    maxPrice,
                    config.priceDecimals,
                    config.decimalSeparator
                  ) +
                  " " +
                  config.priceUnit
                : "",
              align: "right",
              verticalAlign: "top",
              style: {
                color: config.maxPriceColor,
                fontSize: config.graphLabelFontSize
              },
              x: 57 + config.adjustPriceLabelsX,
              y: -3
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
        // max: Math.ceil(maxConsumption),
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
        borderWidth: 0,
        stacking: "normal"
      },
      line: {
        stacking: "normal"
      },
      series: {
        animation: false
      }
    },
    series: series,
    annotations: [
      {
        labels: annotationsLabels
      }
    ],
    credits: {
      enabled: false
    }
  });
}

function sumAdditionalCosts(config) {
  return config.additionalCostPerKWH.reduce((sum, a) => {
    return sum + a.price;
  }, 0);
}
