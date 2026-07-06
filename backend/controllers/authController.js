const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const GullyInfo = require('../models/GullyInfo');

exports.register = async (req, res) => {
  try {
    const { gullyName, password } = req.body;
    let gully = await GullyInfo.findOne({ gullyName });
    if (gully) return res.status(400).json({ msg: 'Gully already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    gully = new GullyInfo({ gullyName, password: hashedPassword });
    await gully.save();
    
    // Generate JWT token
    const token = jwt.sign({ id: gully._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });
    
    res.json({ _id: gully._id, gullyName: gully.gullyName, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { gullyName, password } = req.body;
    let gully = await GullyInfo.findOne({ gullyName });
    if (!gully) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, gully.password);
    
    if (!isMatch) {
      // Backward compatibility for existing plaintext passwords
      if (gully.password === password) {
        const salt = await bcrypt.genSalt(10);
        gully.password = await bcrypt.hash(password, salt);
        await gully.save();
      } else {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: gully._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });
    
    res.json({ _id: gully._id, gullyName: gully.gullyName, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

