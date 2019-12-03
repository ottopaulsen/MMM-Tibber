"use strict";

const twoDaysHours = [
    '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23',
    '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'
]

Module.register("MMM-Tibber", {

    getScripts: function () {
        return [
            this.file('node_modules/highcharts/highcharts.js'),
            this.file('node_modules/highcharts/modules/annotations.js'),
        ];
    },

    // Default module config
    defaults: {
        tibberToken: "log in to tibber to find your token",
        logging: false,
        decimalSeparator: ",",
        priceFontSize: 16,
        showMinPrice: true,
        showMaxPrice: true,
        showCurrentPrice: true,
        minPriceX: -40,
        minPriceY: 10,
        maxPriceX: -40,
        maxPriceY: 0,
        minPriceLineWidth: 1,
        maxPriceLineWidth: 1,
        minPriceColor: "#00bb00",
        curPriceColor: "#cccc00",
        maxPriceColor: "#ee0000",
        xAxisLineColor: "#333333",
        xAxisLabelColor: "#999999",
        historyHours: 24,
        futureHours: 48,
        columnColors: {
            'NORMAL': ['#000055', '#0000dd', '#000088'], // Blue
            'CHEAP': ['#003300', '#00bb00', '#006600'], // Green
            'EXPENSIVE': ['#440000', '#cc0000', '#770000'] // Red
        }
    },

    start: function () {
        console.log(this.name + ' started.');
        this.loaded = true;
        this.updateDom();
        this.sendSocketNotification('TIBBER_CONFIG', this.config);
    },

    interval: null,

    socketNotificationReceived: function (notification, payload) {
        var self = this;
        if (notification === 'TIBBER_PRICE_DATA') {
            if (payload != null) {
                this.drawPrice(payload);
                clearInterval(this.interval);
                this.interval = setInterval(() => {
                    this.drawPrice(payload);
                }, 30000);
            } else {
                console.log(self.name + ': TIBBER_DATA - No payload');
            }
        }
    },

    getStyles: function () {
        return [
            'MMM-Tibber.css'
        ];
    },

    getDom: function () {
        self = this;
        const wrapper = document.createElement("div");

        // Price chart
        const priceChart = document.createElement("div");
        priceChart.setAttribute("id", "pricechart");
        priceChart.setAttribute("style", "width:700px; height:200px;");

        const tekst = document.createElement("p");
        tekst.innerHTML = "No Tibber data";
        priceChart.appendChild(tekst);

        wrapper.appendChild(priceChart);
        return wrapper;
    },

    showHour: function (hour, now) {
        return hour >= now - this.config.historyHours 
            && hour <= now + this.config.futureHours;
    },

    drawPrice: function (prices) {
        let minPrice = prices.twoDays.reduce((min, p) => p.total < min ? p.total : min, prices.twoDays[0].total);
        let maxPrice = prices.twoDays.reduce((max, p) => p.total > max ? p.total : max, prices.twoDays[0].total);
        let now = new Date().getHours()
        let curPriceBackgroundColor
        let curPrice = prices.current
        let categories = [];
        let data = [];

        for(let i = 0; i < 48; i++) {
            if(this.showHour(i, now)) {
                let ci = i < now ? 0 : i == now ? 1 : 2
                categories.push(twoDaysHours[i]);
                if(prices.twoDays.length > i) {
                    let p = prices.twoDays[i]
                    data.push(
                        {
                            y: p.total,
                            color: this.config.columnColors[p.level][ci],
                            id: i == now ? 'cur' : '',
                        }
                    )
                }
            }
        }

        
            
        Highcharts.chart('pricechart', {
            chart: {
                type: 'column',
                backgroundColor: '#000000',
            },
            title: {
                text: '',
            },
            xAxis: {
                categories: categories,
                labels: {
                    style: {
                        color: this.config.xAxisLabelColor
                    }
                },
                lineColor: this.config.xAxisLineColor,
            },
            yAxis: {
                startOnTick: false,
                title:{
                    text:'',
                },
                min: minPrice - 0.1,
                plotLines: [
                    {
                        color: this.config.minPriceColor,
                        width: this.config.showMinPrice ? this.config.minPriceLineWidth : 0,
                        value: minPrice,
                        zIndex: 5,
                        label: {
                            text: this.config.showMinPrice ? this.formatPrice(minPrice) : '',
                            align: 'left',
                            style: {
                                color: this.config.minPriceColor,
                                fontSize: this.config.priceFontSize
                            },
                            x: this.config.minPriceX,
                            y: this.config.minPriceY,
                        },
                    },
                    {
                        color: this.config.maxPriceColor,
                        width: this.config.showMaxPrice ? this.config.maxPriceLineWidth : 0,
                        value: maxPrice,
                        zIndex: 5,
                        label: {
                            text: this.config.showMaxPrice ? this.formatPrice(maxPrice) : '',
                            align: 'left',
                            style: {
                                color: this.config.maxPriceColor,
                                fontSize: this.config.priceFontSize
                            },
                            x: this.config.maxPriceX,
                            y: this.config.maxPriceY,
                        },
                    },
                ],
                gridLineColor: '#000000',
                labels: {
                    style: {
                        color: '#000000'
                    }
                },
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                column: {
                    pointPadding: 0.0,
                    groupPadding: 0.0,
                    borderWidth: 0,
                },
                series: {
                    animation: false
                }
            },
            series: [{
                name: 'Strømpris',
                data: data,
            }],
            annotations: [{
                labels: [
                    {
                        point: this.config.showCurrentPrice ? 'cur' : 'dontshow',
                        text: this.formatPrice(curPrice),
                        backgroundColor: curPriceBackgroundColor,
                        borderColor: this.config.curPriceColor,
                        y: -40,
                        style: {
                            color: this.config.curPriceColor,
                            fontSize: this.config.priceFontSize,
                        },
                    },
                ]
            }],
            credits: {
                enabled: false
            },
        });
    },

    formatPrice: function (price) {
        const p = Math.floor(price);
        const c = Math.round((price - p) * 100, 0)
        return "" + p + this.config.decimalSeparator + c;
    },

});