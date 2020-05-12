
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');
const routes = require('./routes');
const clientPath = '../medinsight-ui/build';


const app = express();
const router = express.Router();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(path.join(__dirname, clientPath)));


router.route('/posts')
    .get(routes.getPosts)
    .post(routes.addPost);

router.route('/tags')
    .get(routes.getTags);

router.route('/search')
    .post(routes.searchPosts);

// all of our routes will be prefixed with /api
app.use('/api/test', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1', router);
app.get('*', function(req, res) {
    res.redirect('/');
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on ${port}`)
})
