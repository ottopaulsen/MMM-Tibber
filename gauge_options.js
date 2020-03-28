const gaugeOptions = function(config) {
  return {
    chart: {
      type: "solidgauge",
      backgroundColor: "#000"
    },

    title: null,

    pane: {
      center: ["50%", "85%"],
      size: "140%",
      startAngle: -90,
      endAngle: 90,
      background: {
        backgroundColor: "#000",
        borderColor: "#444",
        innerRadius: "60%",
        outerRadius: "100%",
        shape: "arc"
      }
    },

    // the value axis
    yAxis: {
      lineWidth: 0,
      tickWidth: 0,
      minorTickInterval: null,
      tickAmount: 2,
      categories: [],
      title: {
        y: 28,
        style: {
          fontSize: config.gaugesTitleFontSize
        }
      },
      labels: {
        style: {
          fontSize: config.gaugesLabelFontSize + "px"
        }
      }
    },

    plotOptions: {
      solidgauge: {
        dataLabels: {
          enabled: false,
          y: 25,
          borderWidth: 0,
          useHTML: true,
          style: { color: "#777" }
        }
      }
    }
  };
};
