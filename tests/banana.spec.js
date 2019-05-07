import chai from 'chai';
import chaiHttp from 'chai-http';
import { app } from '../server.js';
import stand from '../api/models/bananas';

// Configure chai
chai.use(chaiHttp);
chai.should();

// Tests
describe("BananaStand", () => {
    // Test buying bananas
    describe("purchasing", () => {
        // Simple buy
        it("should buy 20 bananas", (done) => {
            let payload = { qty: 20, date: '2019-05-06' };
            // switch to in-memory db
            stand.open(':memory:');
            chai.request(app)
                .post('/api/buy')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status');
                    res.body.status.should.equal('success');
                    done();
                });
         });
         // Bad buy
         it("should not buy -20 bananas", (done) => {
             let payload = { qty: -20, date: '2019-05-06' };
             // switch to in-memory db
             stand.open(':memory:');
             chai.request(app)
                 .post('/api/buy')
                 .set('content-type', 'application/x-www-form-urlencoded')
                 .send(payload)
                 .end((err, res) => {
                     res.should.have.status(400);
                     done();
                 });
          });
          // Bad date 
          it("should not buy with invalid date", (done) => {
              let payload = { qty: -20, date: '2019-053-064' };
              // switch to in-memory db
              stand.open(':memory:');
              chai.request(app)
                  .post('/api/buy')
                  .set('content-type', 'application/x-www-form-urlencoded')
                  .send(payload)
                  .end((err, res) => {
                      res.should.have.status(400);
                      done();
                  });
           });
    });
    // Testing selling bananas
    describe("selling", () => {
        // Bad sell
        it("should not sell 20 bananas from nothing", (done) => {
            let payload = { qty: 20, date: '2019-05-06' };
            // switch to in-memory db
            stand.open(':memory:');
            chai.request(app)
                .post('/api/sell')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status');
                    res.body.status.should.equal('failure');
                    res.body.should.have.property('qty');
                    res.body.qty.should.equal(0);
                    done();
                });
         });
         // Bad sell quantity
         it("should not sell -20 bananas", (done) => {
             let payload = { qty: -20, date: '2019-05-06' };
             // switch to in-memory db
             stand.open(':memory:');
             chai.request(app)
                 .post('/api/sell')
                 .set('content-type', 'application/x-www-form-urlencoded')
                 .send(payload)
                 .end((err, res) => {
                     res.should.have.status(400);
                     done();
                 });
          });
    });
    // Testing buying+selling bananas
    describe("buy/sell", () => {
        // Buy+Sell
        it("should buy and sell 20 bananas", (done) => {
            let payload = { qty: 20, date: '2019-05-06' };
            // switch to in-memory db
            stand.open(':memory:');
            chai.request(app)
                .post('/api/buy')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status');
                    res.body.status.should.equal('success');
                    chai.request(app)
                        .post('/api/sell')
                        .set('content-type', 'application/x-www-form-urlencoded')
                        .send(payload)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('status');
                            res.body.status.should.equal('success');
                            res.body.should.have.property('qty');
                            res.body.qty.should.equal(20);
                            done();
                        });
                });
        });
        // Buy+Sell Incomplete
        it("should buy 20 and sell 20 of 30 bananas", (done) => {
            let payload_buy = { qty: 20, date: '2019-05-06' };
            let payload_sell = { qty: 30, date: '2019-05-06' };
            // switch to in-memory db
            stand.open(':memory:');
            chai.request(app)
                .post('/api/buy')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send(payload_buy)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status');
                    res.body.status.should.equal('success');
                    chai.request(app)
                        .post('/api/sell')
                        .set('content-type', 'application/x-www-form-urlencoded')
                        .send(payload_sell)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.should.have.property('status');
                            res.body.status.should.equal('success');
                            res.body.should.have.property('qty');
                            res.body.qty.should.equal(20);
                            res.body.should.have.property('message');
                            res.body.message.should.contain('incomplete');
                            done();
                        });
                });
        });
        // Twos Buy+Sell Incomplete because of Expiring
        it("should buy 20+20 and sell 20 of 30 bananas (10 expired)", (done) => {
            let payload_buy1 = { qty: 20, date: '2019-05-06' };
            let payload_buy2 = { qty: 20, date: '2019-05-26' };
            let payload_sell = { qty: 30, date: '2019-05-26' };
            // switch to in-memory db
            stand.open(':memory:');
            chai.request(app)
                .post('/api/buy')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send(payload_buy1)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status');
                    res.body.status.should.equal('success');
                    chai.request(app)
                    .post('/api/buy')
                    .set('content-type', 'application/x-www-form-urlencoded')
                    .send(payload_buy2)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.should.have.property('status');
                        res.body.status.should.equal('success');
                        chai.request(app)
                            .post('/api/sell')
                            .set('content-type', 'application/x-www-form-urlencoded')
                            .send(payload_sell)
                            .end((err, res) => {
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                res.body.should.have.property('status');
                                res.body.status.should.equal('success');
                                res.body.should.have.property('qty');
                                res.body.qty.should.equal(20);
                                res.body.should.have.property('message');
                                res.body.message.should.contain('incomplete');
                                done();
                            });
                    });
                });
        });
        // Twos Buy+Sell Complete
        it("should buy 20+20 and sell 30", (done) => {
            let payload_buy1 = { qty: 20, date: '2019-05-06' };
            let payload_buy2 = { qty: 20, date: '2019-05-07' };
            let payload_sell = { qty: 30, date: '2019-05-08' };
            // switch to in-memory db
            stand.open(':memory:');
            chai.request(app)
                .post('/api/buy')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send(payload_buy1)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status');
                    res.body.status.should.equal('success');
                    chai.request(app)
                    .post('/api/buy')
                    .set('content-type', 'application/x-www-form-urlencoded')
                    .send(payload_buy2)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.should.have.property('status');
                        res.body.status.should.equal('success');
                        chai.request(app)
                            .post('/api/sell')
                            .set('content-type', 'application/x-www-form-urlencoded')
                            .send(payload_sell)
                            .end((err, res) => {
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                res.body.should.have.property('status');
                                res.body.status.should.equal('success');
                                res.body.should.have.property('qty');
                                res.body.qty.should.equal(30);
                                res.body.should.have.property('message');
                                res.body.message.should.contain('complete');
                                done();
                            });
                    });
                });
        });
    });
    // Testing Metrics
    describe("metrics", () => {
        // Basic metrics test
        it("should respond to status request", (done) => {
            // switch to in-memory db
            stand.open(':memory:');
            chai.request(app)
                .get('/api/status/2019-05-06')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status');
                    res.body.status.should.equal('success');
                    done();
                });
        });
    });
});


