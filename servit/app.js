// SERVIT web application backend v.0.1
// author mikko.valjakka@anycase.fi
// recommended: Node.js 6.9
// required: latest web3 library for Node.js

// some basic libraries
var readlineSync = require('readline-sync');
var Web3 = require('web3');               // newest web3 for Node.js, uses Promises
var pt   = require('promise-timeout');   // for all kinds of timeouts
var fs = require('fs')

// Ethereum
// Connect to local Ethereum
var network = 'http://localhost:8545'
// var web3 = new Web3(new Web3.providers.HttpProvider(network));

function connect(network,next,error) {
    var web3 = new Web3(new Web3.providers.HttpProvider(network));
    web3.eth.getCoinbase(function(err,result) {
        if (err) 
            error(err)
        else
            next(web3)
    })
}


var auth_json = './contract/Authorizations.json'
var prof_json = './contract/Profile.json'
var agree_json = './contract/Agreement.json'
var deliv_json = './contract/Delivery.json'

try {
   var foo = JSON.parse(fs.readFileSync(auth_json).toString())
   var auth_abi  = foo['abi']
   var auth_solc = foo['unlinked_binary']
   foo = JSON.parse(fs.readFileSync(prof_json).toString())
   var prof_abi  = foo['abi']
   var prof_solc = foo['unlinked_binary']
   foo = JSON.parse(fs.readFileSync(agree_json).toString())
   var agree_abi  = foo['abi']
   var agree_solc = foo['unlinked_binary']
   foo = JSON.parse(fs.readFileSync(deliv_json).toString())
   var deliv_abi  = foo['abi']
   var deliv_solc = foo['unlinked_binary']
      
} catch (err) {
    console.log('file error with contract json descriptions')
    return
}


// MySQL

// Development

var mysql      = require('mysql');
var conn;      // global database connection
var dbconfig = {
  host     : 'localhost',
  user     : 'servit',
  password : 'nakamoto',
  database : 'servit'
}

// Production (node1.anycase.info)

/*
var dbconfig = {
  socketPath     : '/var/run/mysqld/mysqld.sock',
  user     : 'mvaljakka',
  password : 'Kovis007',
  database : 'mvaljakka'
};

*/

function dbconn() { 
    // set global conn plus also return it
    conn = mysql.createConnection(dbconfig);
    conn.on('error', function(err) {
        console.log(err.code); // 'ER_BAD_DB_ERROR'
    })
    return conn
}


// some variables and constants for Ethereum

var newpass = 'mypassword'
var coinbase

// coinbase password!
var basepass = 'nakamoto'

// suitable timeouts
var short_time = 3*1000
var long_time  = 15*1000


// load user (Profile) data to memory for quick access for authentication
var profiles = {};
function load_profiles() {
    dbconn();
    conn.query("select id,email,passhash from Profile", function (error, results, fields) {
        profiles = results;
        conn.destroy();
    });
}
load_profiles();
function profile(email) {
    var i=0;
    while (i<profiles.length) {
        if (profiles[i]["email"] == email) return profiles[i];
        i++;
    }
    return false;
}

// Express REST

var express = require('express');   // express tarjoaa helpon HTTP:n
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.text());

var res_global;   // to pass http result object to callback functions

// SHA256
var sha256 = require('sha256')

// CORS: cross-origin scripting: sallitaan yhteydet kaikkialta
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  next();
});

// basic auth: lisää http-funktioihin keskimmäiseksi parametriksi "auth"
// tunnarit: foo bar
var basicAuth = require('basic-auth');
var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  };
  var user = basicAuth(req);
  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };
  if ((profile(user.name) && (sha256(user.pass)==profile(user.name).passhash)) || ((user.name=='scott') && (user.pass=='tiger')))  // uhh. quic and dirty
    return next();
  else 
    return unauthorized(res);
  /*
  if (user.name == 'foo' && user.pass == 'bar') {
    return next();
  } else {
    return unauthorized(res);
  };
  */
};



app.get("/", function (req, res) {
   console.log("GET-pyyntö " + req.params.file);
   res.sendfile("public/admin.html"); 
});

// tämä funktio antaa minkä tahansa tiedoston public/*
// GET  /public/file.html  -->  static/file.html  
app.get("/public/:file", function (req, res) {
   console.log("GET-pyyntö " + req.params.file);
   res.sendfile("public/" + req.params.file); 
});

app.get("/images/:file", function (req, res) {
   console.log("GET-pyyntö " + req.params.file);
   res.sendfile("public/images/" + req.params.file); 
});

app.get("/js/:file", function (req, res) {
   console.log("GET-pyyntö " + req.params.file);
   res.sendfile("public/js/" + req.params.file); 
});

app.get("/css/:file", function (req, res) {
   console.log("GET-pyyntö " + req.params.file);
   res.sendfile("public/css/" + req.params.file); 
});

app.get("/monitor/:email", function (req, res) {
    res.sendfile("public/monitor.html");
});

function sleep(time) {
   var stop = new Date().getTime();
   while(new Date().getTime() < stop + time) { ; }
}


// GET  /api/resource/table/key/value/order   OR  table/any/any/any --> all
app.get('/api/resource/:table/:key/:val/:order', auth, function (req, res) {
    var table = req.params.table
    var key   = req.params.key
    var val   = req.params.val
    var order = req.params.order
    if (key=='any')
        var sql = "select * from " + table
    else
        var sql = "select * from " + table + " where " + key + "='" + val + "'"   // TO DO: add SQLDANGER and use PREPARED syntax
    if (order != 'any') sql += " order by " + order
    console.log(sql)
    dbconn();
    res_global = res
    conn.query(sql, function (error, results, fields) {
       res_global.set({ 'content-type': 'application/json; charset=utf-8' })
       if (error) { res_global.end('{"status":"SQL error"}'); return }
       console.log(JSON.stringify(results));
       res_global.end(JSON.stringify(results));
       conn.destroy();
     });
});


// POST  
app.post('/api/resource/:table', auth, function (req, res) {
    console.log(req.body); // debug: näytetään konsolilla mitä putkesta tuli
    var rec = JSON.parse(req.body);   // muutetaan JSON-syöte olioksi
    var table = req.params.table
    var placeholders = "("
    var values = []
    var sql = "insert into " + table + "("
    for (var key in rec)
        if (rec.hasOwnProperty(key)) {
            sql += key + ','
            placeholders += "?,"
            values.push(rec[key])
        }
    sql = sql.substring(0,sql.length-1) + ") values" + placeholders.substring(0,placeholders.length-1) + ")"
           
    console.log(sql + " " + JSON.stringify(values))
    dbconn();
    res_global = res
    conn.query(sql,values, function (error, results, fields) {
       if (error) res_global.end('{"status":"SQL error"}')
       console.log(JSON.stringify(results));
       res_global.set({ 'content-type': 'application/json; charset=utf-8' })
       res_global.end('{"id":"'+results.insertId+'"}');
       conn.destroy();
     });
     // if new profile, add to memory
     if (table == "Profile") profiles[rec["email"]] = {id:rec.id,email:id.email,passhash:id.pass};
});




// PUT
app.put('/api/resource/:table', auth, function (req, res) {
    console.log(req.body); // debug: näytetään konsolilla mitä putkesta tuli
    var rec = JSON.parse(req.body);   // muutetaan JSON-syöte olioksi
    var table = req.params.table
    var sql = "update " + table + " set "
    var values = []
    for (var key in rec)
        if (rec.hasOwnProperty(key)) {
            sql += key + " = ?,"
            values.push(rec[key])
        }
    sql = sql.substring(0,sql.length-1)
    if (table == "Profile") { 
        sql += " where email = ?";
        var user = basicAuth(req);
        values.push(user.name);
    }
    console.log(sql + " " + JSON.stringify(values))
    dbconn();
    res_global = res
    conn.query(sql,values, function (error, results, fields) {
       res_global.set({ 'content-type': 'application/json; charset=utf-8' })
       if (error) { res_global.end('{"status":"SQL error"}'); return }
       console.log(JSON.stringify(results));
       res_global.end('{"id":"'+results.insertId+'"}');
       if (table=="Profiles") load_profiles(); else conn.destroy();
     });
     
});

// DELETE  
app.delete('/api/resource/:table/:id', auth, function (req, res) {
   var table = req.params.table
   var id    = req.params.id
   var user = basicAuth(req);  // ensure a user can only delete his own data
   var user_email = user.name;
   var sql = "delete from "+table
   if (table != "Service") return;   // safety for now
   if (table == "Service") {
      sql += " where id = ? and profile_id in (select id from Profile where email = ?)"
      res_global=res;
      dbconn();
      conn.query(sql,[id,user_email], function(error,results,fields) {
          res_global.set({ 'content-type': 'application/json; charset=utf-8' })
          if (error) { res_global.end('{"status":"SQL error"}'); return }
          var output = "{}"; // palautetaan jotain kieliopin mukaista
          res_global.end(output);
          conn.destroy()
      });
   }
});

// -------------------  Interaction with Ethereum --------------------------------

// new profile -------------------------------------------------------------------
/*
STEPS:
   save person as zombie (SQL)
0. create address for person (non-tx) newperson
1. unlock coinbase
2. transfer gas money from Coinbase to newperson (tx)
3. confirm transaction
4. unlock newperson
5. deploy Authorizations Contract for newperson (tx)
6. confirm transaction
7. deploy Profile to newperson (tx)
8. on confirmation, set person zombie->ok (SQL)
*/
app.post('/api/newprofile', function (req, res) {
    console.log(req.body); // debug: näytetään konsolilla mitä putkesta tuli
    var sql = "insert into Profile(firstname,lastname,email,tel,company,eth,passhash,status) values(?,?,?,?,?,?,?,?)"
    var rec = JSON.parse(req.body)
    if (profile[rec.email]) { res.end('{"status":"existing email"}'); return }
    dbconn();
    conn.query(sql,[rec.firstname,rec.lastname,rec.email,rec.tel,rec.company,rec.eth,sha256(rec.pass),'zombie'], function (error, results, fields) {
       res.set({ 'content-type': 'application/json; charset=utf-8' })
       if (error) {
           console.log("SQL error " + error);
           res.end('{"status":"SQL error"}')
           return
       } else {
           rec.id = results.insertId
           console.log('Profile data recorded to MySQL with id : '+rec.id+' Now trying Ethereum profile...');
           log(conn,rec.id,'[SQL] OK','Profile data recorded to MySQL with id : '+rec.id+' Now trying Ethereum profile...')
           
       }
       // refresh profiles list
       load_profiles();  // this also says conn.destroy
       commence_eth_profile(rec,res)
     });
});


var web3;

function commence_eth_profile(rec,res) {
    // try Ethereum connection
    web3 = new Web3(new Web3.providers.HttpProvider(network));
    
    var addr1;  // address for the new user
    
    var pass = rec.pass   // new user's plain password will be given to his/her eth account, too
    
    pt.timeout(web3.eth.getCoinbase(),short_time)
        .then(function(cob) { step0(rec,cob) })
        .catch(function(err){ log(rec.id,'[ETH] ERROR','failed to get coinbase (timeout?)')})

    function step0(rec,cob) {
        coinbase = cob
        console.log("Coinbase is " + coinbase)
        pt.timeout(web3.eth.getBalance(coinbase),short_time).then(step1).catch(function(err){console.log(err)})
    }

    function step1(x) {
        console.log("Coinbase has " + web3.utils.fromWei(x) + " Ether")
        pt.timeout(web3.eth.personal.newAccount(pass),short_time).then(step2).catch(function(err){console.log(err)})
    }

    function step2(x) {
        addr1 = x
        console.log("new address " + addr1)
        log(conn,rec.id,'[ETH] OK','your Ethereum address: ' + addr1)
        // now we report back to web interface 
        //     to do: report error to web interface
        res.end('{"status":"ok","address":"'+addr1+'"}');
        // all feedback from nowon for this procedure goes to log only  
        pt.timeout(web3.eth.personal.unlockAccount(addr1,pass),short_time).then(step3).catch(function(err){console.log(err)})
    }

    function step3(x) {
        console.log("unlocking.. " + x)
        console.log("Now unlocking Coinbase..")
        pt.timeout(web3.eth.personal.unlockAccount(coinbase,basepass),short_time).then(step4).catch(function(err){console.log(err)})
    }

    function step4(x) {
        var HAPPY_CONF_COUNT = 3   // we are happy if we get at least 3 confirmations -- to do; for time being, we are always happy.
        
        console.log("unlocking.. " + x)
        console.log("Now coinbase will send 0.1 Eth to the new address.")
        // using the event emitter
        web3.eth.sendTransaction({
            from: coinbase,
            to: addr1,
            value: web3.utils.toWei(0.1)
        }).on('transactionHash', function(hash){
            console.log("Transaction hash: " + hash)
        }).on('receipt', function(receipt){
            console.log("We got receit: " + receipt)
            // just to make sure; not required
            web3.eth.getBalance(addr1).then(function(x) {console.log("on receipt: addr1 balance is " + x)})
            // continue to step 5 with no argument
            step5()
        })
     //   .on('confirmation', function(cn, receipt){ 
     //       console.log("We got confirmation #"+cn)    // we may count confirmations if we like to
     //       web3.eth.getBalance(addr1).then(function(x) {console.log("on confirmation: addr1 balance is " + x)})
     //   })
          .on('error', function(err) {
               console.log('ETH error: failed to transfer some eth: ' + err)
               log(conn,rec.id,'[ETH] ERROR','failed to transfer some Ether '+ err)
           });
    }
    
    function step5() {
        console.log("Introducing contracts Auth, Profile")
        var auth_c    = new web3.eth.Contract(auth_abi);
        var profile_c = new web3.eth.Contract(prof_abi);
        var confirmation_count = 0
        console.log("deploying Auth..")
        auth_c.deploy({   // the compiled contract code, pasted from the online compiler
            data: auth_solc, 
            arguments: []   // constructor parameters
        })
        .send({      // who creates the contract and pays the bill
            from: acc,
            gas: 1500000
            // gasPrice: '3000000000000'
        }, function(error, transactionHash){ 
            if (error) { 
                console.log("Error " + error);
                log(conn,rec.id,'[ETH] ERROR','Cant deploy Authorizations ' + error)
            }    
            else {
                console.log("TX hash " + transactionHash);
                log(conn,rec.id,'[ETH] OK','Authorizations deploy TX ' + transactionHash)
            }    
        })
        .on('error', function(error) { 
                console.log("Error " + error);
                log(conn,rec.id,'[ETH] ERROR','Cant deploy Authorizations ' + error)
         })
        .on('transactionHash', function(transactionHash){ 
            console.log("Deploy transaction hash: " + transactionHash) })
        .on('receipt', function(receipt){
            console.log("Success : Auth contract address is " + receipt.contractAddress)
            log(conn,rec.id,'[ETH] OK','Authorizations deployed, address: ' + receipt.contractAddress)
        })
        .on('confirmation', function(confirmationNumber, receipt){    // This gives us 24 confirmations on Geth test network. We are going to count to.. three.
            // console.log("Confirmations received (Auth): " + confirmationNumber)
            confirmation_count++
            if (confirmation_count == HAPPY_CONF) 
                log(conn,rec.id,'[ETH] OK','Authorizations deploy: we got at least '+HAPPY_CONF+' confirmations')
        })
        .then(function(new_c){
            console.log("Authorizations instance established, address " + new_c.options.address) // instance with the new contract address
            console.log("Proceeding to deploy the actual Profile")
            log(conn,rec.id,'[ETH] OK','Proceeding to Profile deployment...')
            auth_addr = new_c.options.address
            step6(acc,auth_addr,profile_c)
        });
    }
    // We have everything for new Profile
    function step6(acc,auth_addr,profile_c) {
        profile_c.deploy({   
            data: prof_solc, // the compiled contract code, pasted from the online compiler
            arguments: [auth_addr,acc,"0x"+kecc]   // constructor parameters
        })
        .send({      // who creates the contract and pays the bill
            from: acc,
            gas: 1500000
            // gasPrice: '30000000000000'
        }, function(error, transactionHash){ 
            if (error) console.log("Error (0) " + error); 
            else console.log("TX hash " + transactionHash); 
        })
        .on('error', function(error) { console.log("Deploy error " + error) })
        .on('transactionHash', function(transactionHash){ 
            console.log("Deploy transaction hash: " + transactionHash) })
        .on('receipt', function(receipt){
            console.log("Success : Profile contract address is " + receipt.contractAddress)
        })
    //  .on('confirmation', function(confirmationNumber, receipt){ 
    //      console.log("Confirmations received (Profile): " + confirmationNumber) })
        .then(function(new_c){
            console.log("Contract instance established, address " + new_c.options.address) // instance with the new contract address
            profile_addr = new_c.options.address
        });
    }
} // END commence_eth_profile

// END new profile  ------------------------------------------------------------------

// easy logging to Log table
function log(conn,profile_id,status,msg) {
    var sql = 'insert into Log(profile_id,status,txmsg) values(?,?,?)';
    conn.query(sql,[profile_id,status,msg], function(err,res,f) { 
        if (err) { 
            console.log("SQL LOG error: "+err+" trying to reconnect once.")
            conn = dbconn()
            conn.query(sql,[profile_id,status,msg], function(err,res,f) { if (err) console.log("SQL LOG error: "+err+" still doesnt work.") })
        }
    })
}


// start REST service
var server = app.listen(8080, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)
});
