'use strict';

import bananaStand from '../models/bananas.js';

export function buy(req, res) {
    // get the values
    const dt = req.body.date;
    const qty = req.body.qty;
    console.log(`controller:buy: ${dt} for ${qty}`);
    setImmediate(() => {
        // buy bananas
        bananaStand.purchase(qty,dt, () => {
            res.status(200).json({ 'status': 'success' });

        }, (err) => {
            res.status(400).send(err);
        });
    });
}

export function sell(req, res) {
    // get the values
    const dt = req.body.date;
    const qty = req.body.qty;
    console.log(`controller:sell: ${dt} for ${qty}`);
    setImmediate(() => {
        // sell bananas
        bananaStand.sell(qty,dt, (sold) => {
            let message = (qty == sold) ? 'sale complete' : `sale incomplete: ${sold} of ${qty}`;
            let status = (sold == 0) ? 'failure' : 'success';
            res.status(200).json({ 'status': status, 'qty': sold, 'message': message });
        }, (err) => {
            res.status(400);
            res.send(err);
        });
    });
}


export function status(req, res) {
    // get the values
    const dt = req.params.date;
    console.log(`controller:status: ${dt}`);
    setImmediate(() => {
        // get banana stand metrics
        bananaStand.metrics(dt, (data) => {
            data.status = 'success';
            res.status(200).json(data);
        }, (err) => {
            res.status(400);
            res.send(err);
        });
    });
}

export function dump(req, res) {
    // get the values
    console.log(`controller:dump`);
    setImmediate(() => {
        // get banana stand metrics
        bananaStand.dump((rows) => {
            res.status(200).json(rows);
        }, (err) => {
            res.status(400);
            res.send(err);
        });
    });
}

