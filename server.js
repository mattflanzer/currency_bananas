import express from 'express';
import bodyParser from 'body-parser';
import routes from './api/routes/bananasRoutes.js';

export const app = express();
const port = process.env.PORT || 3000;

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', routes);

app.listen(port, () => {
    console.log('bananas API server started on: ' + port);
});
