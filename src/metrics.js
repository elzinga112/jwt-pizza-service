const os = require('os');
const config = require('./config.json');

const PERIOD = 1000;

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

    constructor() {
        this.sendMetricsPeriodically(PERIOD);
    }

    requestTracker(req, res, next) {
        const start = Date.now();
        const method = req.method;
        this.incrementRequest(method);

        if(req.url === '/api/auth') {
          this.handleAuthRequest(req, res);
        }

        if(req.url === '/api/order') {
          this.handleOrderRequest(req, res);
        }

        res.on('finish', () => {
            const duration = Date.now() - start;
            const buf = new MetricBuilder();
            buf.addHttpMetric(req, res, duration);
            this.sendMetricToGrafana(buf.toString('\n'));
        });
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
            const metrics = new MetricBuilder();
            metrics.addMetric('cpu', "", "total", this.getCpuUsagePercentage());
            metrics.addMetric('memory', "", "total", this.getMemoryUsagePercentage());

            metrics.addMetric('request', 'all', 'total', this.totalRequests);
            metrics.addMetric('request', 'get', 'total', this.totalGetRequests);
            metrics.addMetric('request', 'post', 'total', this.totalPostRequests);
            metrics.addMetric('request', 'put', 'total', this.totalPutRequests);
            metrics.addMetric('request', 'delete', 'total', this.totalDeleteRequests);

            metrics.addMetric('activeUsers','current', 'total', this.currentUsers);

            metrics.addMetric('auth', 'success', 'total', this.totalAuthSuccess);
            metrics.addMetric('auth', 'failure', 'total', this.totalAuthFailure);

            metrics.addMetric('order', 'total', 'total', this.pizzaOrders);
            metrics.addMetric('revenue', 'revenue', 'total', this.revenue);
            metrics.addMetric('order', 'failed', 'total', this.creationFailed);

            for(const metric of metrics.build()) {
              this.sendMetricToGrafana(metric);
            }
        } catch (error) {
            console.log('Error sending metrics', error);
        }
        }, period);
    }

    sendMetricToGrafana(metric) {    
        fetch(`${config.url}`, {
          method: 'post',
          body: metric,
          headers: { Authorization: `Bearer ${config.userId}:${config.apiKey}` },
        })
          .then((response) => {
            if (!response.ok) {
              console.error('Failed to push metrics data to Grafana');
            } else {
              console.log(`Pushed ${metric}`);
            }
          })
          .catch((error) => {
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
            else if (res.statusCode === 401) {
              this.totalAuthFailure++;
            }
          }
          else if(req.method === 'DELETE' && res.statusCode === 200) {
            this.currentUsers--;
          }
        });
      }

      handleOrderRequest(req, res) {
        const startTime = Date.now();
        res.on('finish', () => {
          const duration = Date.now() - startTime;
          this.sendMetricToGrafana('Pizza Latency', req.method, 'latency', duration);
          if(res.statusCode === 200) {
            const order = req.body.order;
            for (const item of order.items) {
              this.pizzaOrders++;
              this.revenue += item.price;
          }
        }
        else { 
          this.creationFailed++;
        }
      });
    }
}



const metrics = new Metrics();
module.exports = metrics;

