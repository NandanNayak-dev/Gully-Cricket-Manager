const Team = require('../models/Team');

exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({ gullyId: req.gullyId }).populate('players');
    res.json(teams);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.createTeam = async (req, res) => {
  try {
    const { teamName, players } = req.body;
    const team = new Team({ gullyId: req.gullyId, teamName, players });
    await team.save();
    res.json(team);
  } catch (err) {
    res.status(500).send('Server error');
  }
};
