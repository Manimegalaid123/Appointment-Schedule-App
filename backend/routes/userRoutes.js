const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/customer/:email', userController.getCustomerByEmail);

module.exports = router;