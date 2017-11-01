// MySQL test
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'node1.anycase.info',
  user     : 'servit',
  password : '007nakamoto',
  database : 'servit'
});
 
connection.connect();
 
connection.query('select * from Test', function (error, results, fields) {
  if (error) throw error;
  console.log(JSON.stringify(results));
});
 
connection.end();
