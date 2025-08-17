const Service = require('../models/Service');

exports.createService = async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getBusinessServices = async (req, res) => {
  try {
    const services = await Service.find({ business: req.params.businessId, status: 'active' });
    res.json(services);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};