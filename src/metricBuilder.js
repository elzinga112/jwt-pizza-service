const config = require('./config.js');

class MetricBuilder {

  constructor() {
    this.metrics = [];
  }

  addMetric(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.metrics.source},method=${httpMethod} ${metricName}=${metricValue}`;
    this.metrics.push(metric);
  }

  build() {
    return this.metrics;
  }
}

module.exports = MetricBuilder;