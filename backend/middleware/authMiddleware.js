const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        req.gullyId = decoded.id;
        return next();
      } catch (err) {
        // Fallback or let it continue if we want strict token check? 
        // If they sent a token, and it's invalid, they should probably re-authenticate
        return res.status(401).json({ msg: 'Token is not valid' });
      }
    }
  }

  // Fallback for existing sessions without token
  const gullyId = req.header('x-gully-id');
  if (gullyId) {
    req.gullyId = gullyId;
    return next();
  }

  return res.status(401).json({ msg: 'No valid authentication provided' });
};
