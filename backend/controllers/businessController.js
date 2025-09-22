const Business = require('../models/Business');
const Service = require('../models/Service');

exports.getByEmail = async (req, res) => {
  try {
    const business = await Business.findOne({ email: req.params.email });
    if (!business) {
      return res.json({ success: false, message: 'Salon not found' });
    }
    res.json({ success: true, business });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateBusiness = async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    res.json({ success: true, business });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Example: inside your registerBusiness function
const newBusiness = new Business({
  businessName: req.body.businessName,
  businessType: req.body.businessType,
  businessAddress: req.body.businessAddress,
  phone: req.body.phone,
  email: req.body.email,
  workingHours: req.body.workingHours,
  imageUrl: req.body.imageUrl, // <-- Save the image URL
  services: req.body.services || []
});
await newBusiness.save();