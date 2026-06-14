// No JWT for simplicity, just a dummy check or passing the gullyId from headers
module.exports = (req, res, next) => {
  const gullyId = req.header('x-gully-id');
  if (!gullyId) return res.status(401).json({ msg: 'No gully id, authorization denied' });
  req.gullyId = gullyId;
  next();
};
