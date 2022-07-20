# openfga-demo
A quick demo of some core features features of OpenFGA.

## Getting Started
The best way to get started is to view the unit tests in `test/store/authorizer.spec.js`.

### Running Tests
```bash
# Clone this repository
$ > git clone --recurse-submodules https://github.com/NateHark/openfga-demo.git
$ > cd openfga-demo
# Install dependencies
$ openfga-demo> npm install
# Start OpenFGA and dependencies via docker-compose
$ openfga-demo> docker-compose up -d
# Run integration tests
$ openfga-demo> npm run test
```

### Running Performance Tests
```bash
# Clone this repository
$ > git clone --recurse-submodules https://github.com/NateHark/openfga-demo.git
$ > cd openfga-demo
# Install dependencies
$ openfga-demo> npm install
# Run performance tests
$ openfga-demo> OPENFGA_API_HOST=<host> OPENFGA_API_PORT=<port> DURATION_MINS=<minutes> ./run-perf-test.sh <task_count>
```