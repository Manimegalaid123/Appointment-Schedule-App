const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');

router.get('/email/:email', businessController.getByEmail);

// Add this line for updating business by ID
router.put('/:id', businessController.updateBusiness);

module.exports = router;