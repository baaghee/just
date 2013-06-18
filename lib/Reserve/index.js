var schema = require('./Reserve').Schema;
module.exports = db.model('reserves', schema);
