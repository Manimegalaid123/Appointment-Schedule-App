const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Add this for creating appointments
router.post('/', appointmentController.createAppointment);

// Add this for updating status
router.put('/:id/status', appointmentController.updateStatus);

// Add this for fetching by business email
router.get('/:businessEmail', appointmentController.getByBusinessEmail);

module.exports = router;