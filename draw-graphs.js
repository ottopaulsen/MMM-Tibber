"use strict";

function drawGraphs(moduleId, tibber, config, sumAdditionalCosts, savingsData) {
  const includeAdditional = config.includeAdditionalCostsInPrice;
  const showFromTime = new Date().addHours(-config.historyHours - 1);
  const showToTime = new Date().addHours(config.futureHours);
  const minConsumption = tibber.minConsumption();
  const maxConsumption = tibber.maxConsumption();
  const priceData = tibber.priceData(
    showFromTime,
    showToTime,
    (level, type) => config.priceColumnColors[level][type]
  );

  const sumAdditional = sumAdditionalCosts;
  const minPrice = priceData.minPrice + (includeAdditional ? sumAdditional : 0);
  const maxPrice = priceData.maxPrice + (includeAdditional ? sumAdditional : 0);

  const curPrice =
    tibber.getCurrentPrice() + (includeAdditional ? sumAdditional : 0);

  const consumptionData = tibber.consumptionData(
    showFromTime,
    config.showConsumptionParts,
    (
      label // Use label to pick right color from config
    ) =>
      config.consumptionParts.reduce((prev, part) => {
        return part.label == label ? part.color : prev;
      }, config.consumptionColor)
  );

  // Series
  const series = [];
  config.showPrice && series.push(seriesPrice(config, priceData));
  config.showSavings && series.push(seriesSavings(config, savingsData));
  config.showAdditionalCostsGraph &&
    series.push(...seriesAdditionalCosts(config, priceData));
  config.showConsumption &&
    series.push(...seriesConsumption(config, consumptionData));
  // console.log("series: ", series);

  // Annotation labels
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
  annotationsLabels.push(...annotationsLabelsConsumptionParts(config));

  // Show time in local timezone
  Highcharts.setOptions({
    time: {
      useUTC: false
    }
  });

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
          enabled: false
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
                : includeAdditional
                ? sumAdditionalCosts
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
                : includeAdditional
                ? sumAdditionalCosts
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
          enabled: false
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
      area: {
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

  function makeAdditionalPriceData(name, priceData, price) {
    return priceData.map((d) => {
      return {
        x: d.x,
        y: price,
        color: d.color,
        id: d.id ? d.id + name : ""
      };
    });
  }

  function formatNumber(n, d, decimalSeparator) {
    // Set number of decimals (d)
    if (n == null) {
      return "";
    }
    const exp = Math.pow(10, d);
    const i = Math.round(n * exp);
    const x = Math.floor(i / exp);
    const y = "" + (i / exp - x);
    return "" + x + decimalSeparator + y.substr(2, d).padEnd(d, "0");
  }

  function seriesPrice(config, priceData) {
    console.log("priceData: ", priceData);
    return {
      name: "Powerprice",
      type: config.priceChartType,
      stack: 1,
      step: "center",
      color: config.savingsColor,
      zIndex: config.priceChartType === "column" ? 5 : 7,
      lineWidth: config.priceLineWidth,
      marker: {
        enabled: false
      },
      data: priceData
    };
  }

  function seriesSavings(config, savingsData) {
    console.log("savingsData: ", savingsData);
    return {
      name: "Savings",
      type: config.savingsChartType,
      stack: 1,
      step: "center",
      color: config.savingsColor,
      borderWidth: 0,
      zIndex: 9,
      pointWidth: config.savingsLineWidth,
      marker: {
        enabled: false
      },
      data: savingsData
    };
  }

  function seriesAdditionalCosts(config, priceData) {
    // console.log("Additional costs priceData: ", priceData);
    const res = [];
    let opacity = 1;
    config.additionalCostPerKWH.forEach((a) => {
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
  }

  function seriesConsumption(config, consumptionData) {
    // console.log("Consumptions consumptionData: ", consumptionData);
    const res = [];
    consumptionData.map((c) => {
      res.push({
        name: c.label || "Unknown",
        type: config.consumptionChartType,
        stack: c.stack,
        color: c.color || config.consumptionColor,
        visible: c.visible,
        opacity: c.opacity,
        zIndex: config.consumptionChartType === "column" ? 5 : 8,
        step: "center",
        lineWidth: config.consumptionLineWidth,
        marker: {
          enabled: false
        },
        yAxis: 1,
        data: c.data
      });
    });
    return res;
  }

  function annotationsLabelsCurrentPrice(config, curPrice) {
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
  }

  function annotationsLabelsMinConsumption(config, minConsumption) {
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
        tibber.consumptionUnit(),
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
  }

  function annotationsLabelsMaxConsumption(config, maxConsumption) {
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
        tibber.consumptionUnit(),
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
  }

  function annotationsLabelsAdditionalCosts(config) {
    // Additional costs
    return config.additionalCostPerKWH.map((a) => {
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
        y: 0 + config.additionalCostsLabelAdjustY,
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
  }

  function annotationsLabelsConsumptionParts(config) {
    let count = 0;
    return config.consumptionParts
      .filter((c) => c.showLabel)
      .map((c) => {
        return {
          point: {
            x: -80 + config.adjustConsumptionLabelsX,
            y: config.graphHeight - 70 - count++ * 10
            // TODO: Calculate y correct
          },
          text: c.label,
          backgroundColor: "#000",
          borderColor: "#000",
          y: 0,
          allowOverlap: true,
          align: "left",
          verticalAlign: "top",
          crop: false,
          overflow: "none",
          style: {
            color: c.color,
            fontSize: config.graphLabelFontSize
          }
        };
      });
  }
}
