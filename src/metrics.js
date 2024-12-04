const os = require('os');
const config = require('./config.js');
const MetricBuilder = require('./metricBuilder.js');

const PERIOD = 20000;

class Metrics {
    totalRequests = 0;
    totalGetRequests = 0;
    totalPostRequests = 0;
    totalPutRequests = 0;
    totalDeleteRequests = 0;
    totalAuthSuccess = 0;
    totalAuthFailure = 0;
    currentUsers = 0;
    pizzaOrders = 0;
    revenue = 0;
    creationFailed = 0;
    metrics = new MetricBuilder();

    constructor() {
      this.incrementRequest = this.incrementRequest.bind(this);
      this.getCpuUsagePercentage = this.getCpuUsagePercentage.bind(this);
      this.getMemoryUsagePercentage = this.getMemoryUsagePercentage.bind(this);
      this.sendMetricsPeriodically = this.sendMetricsPeriodically.bind(this);
      this.sendMetricToGrafana = this.sendMetricToGrafana.bind(this);
      this.handleAuthRequest = this.handleAuthRequest.bind(this);
      this.handleOrderRequest = this.handleOrderRequest.bind(this);
      this.requestTracker = this.requestTracker.bind(this);

      this.sendMetricsPeriodically(PERIOD);
    }

    requestTracker(req, res, next) {
        const method = req.method;
        this.incrementRequest(method);
        this.handleLatency(req, res);
        if(req.url === '/api/auth') {
          this.handleAuthRequest(req, res);
        }

        if(req.url === '/api/order') {
          this.handleOrderRequest(req, res);
        }
        next();
    }

    incrementRequest(method) {
        this.totalRequests++;
        switch (method) {
            case 'GET':
                this.totalGetRequests++;
                break;
            case 'POST':
                this.totalPostRequests++;
                break;
            case 'PUT':
                this.totalPutRequests++;
                break;
            case 'DELETE':
                this.totalDeleteRequests++;
                break;
        }
    }

    getCpuUsagePercentage() {
        const cpuUsage = os.loadavg()[0] / os.cpus().length;
        return cpuUsage.toFixed(2) * 100;
    }
      
    getMemoryUsagePercentage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;
        return memoryUsage.toFixed(2);
    }
      
    sendMetricsPeriodically(period) {
        const timer = setInterval(() => {
        try {
            this.metrics.addMetric('cpu', "total", "total", this.getCpuUsagePercentage());
            this.metrics.addMetric('memory', "total", "total", this.getMemoryUsagePercentage());

            this.metrics.addMetric('requests', 'all', 'total', this.totalRequests);
            this.metrics.addMetric('requests', 'get', 'total', this.totalGetRequests);
            this.metrics.addMetric('requests', 'post', 'total', this.totalPostRequests);
            this.metrics.addMetric('requests', 'put', 'total', this.totalPutRequests);
            this.metrics.addMetric('requests', 'delete', 'total', this.totalDeleteRequests);

            this.metrics.addMetric('activeUsers','current', 'total', this.currentUsers);

            this.metrics.addMetric('auth', 'success', 'total', this.totalAuthSuccess);
            this.metrics.addMetric('auth', 'failure', 'total', this.totalAuthFailure);

            this.metrics.addMetric('order', 'total', 'total', this.pizzaOrders);
            this.metrics.addMetric('revenue', 'revenue', 'total', this.revenue);
            this.metrics.addMetric('order', 'failed', 'total', this.creationFailed);
            this.sendMetricToGrafana(this.metrics.build().join('\n'));
        } catch (error) {
            console.log('Error sending metrics', error);
        }
        }, period);
        timer.unref();
    }

    sendMetricToGrafana(metric) {    
        fetch(`${config.metrics.url}`, {
          method: 'post',
          body: metric,
          headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
        })
          .then((response) => {
            if (!response.ok) {
              console.error('Failed to push metrics data to Grafana:', response.statusText);
            } else {
              console.log(`Pushed ${metric}`);
            }
          })
          .catch((error) => {
            console.error('Failed to push metrics data to Grafana:', response.statusText);
            console.error('Error pushing metrics:', error);
          });
      }

      handleAuthRequest(req, res) {
        res.on('finish', () => {
          if(req.method === 'PUT') {
            if(res.statusCode === 200) {
              this.totalAuthSuccess++;
              this.currentUsers++;
            }
            else {
              this.totalAuthFailure++;
            }
          }
          else if(req.method === 'DELETE' && res.statusCode === 200) {
            this.currentUsers--;
          }
        });
      }

      handleOrderRequest(req, res) {
        res.on('finish', () => {
          if(res.statusCode === 200) {
            if(req.body.items) {
              const items = req.body.items;
              for (const item of items) {
                this.pizzaOrders++;
                this.revenue += item.price;
            }
          }
        }
        else { 
          this.creationFailed++;
        }
      });
    }

    handleLatency(req, res) {
        const startTime = Date.now();
        res.on('finish', () => {
          const duration = Date.now() - startTime;
          const key = req.originalUrl.replace(/\//g, '') + req.method;
          this.metrics.addMetric('latency', key, 'latency', duration);
        });
    }
}

const metrics = new Metrics();
module.exports = metrics;

