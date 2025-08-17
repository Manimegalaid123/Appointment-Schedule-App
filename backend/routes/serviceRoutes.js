const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

router.post('/', serviceController.createService);
router.get('/business/:businessId', serviceController.getBusinessServices);

module.exports = router;