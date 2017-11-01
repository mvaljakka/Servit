var readlineSync = require('readline-sync');
var Web3 = require('web3');
var pt   = require('promise-timeout');
var fs = require('fs')
var sha3 = require('js-sha3')

var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

var pass = 'mypassword'
var addr1
var coinbase
var basepass = 'nakamoto'

var auth_json = './servit/contract/Authorizations.json'
var prof_json = './servit/contract/Profile.json'
var agree_json = './servit/contract/Agreement.json'
var deliv_json = './servit/contract/Delivery.json'

var short_time = 3*1000
var long_time  = 15*1000

function err(e) {
   console.log("Error " + e);   
}


try {
   var foo = JSON.parse(fs.readFileSync(auth_json).toString())
   var auth_abi  = foo['abi'] 
   foo = JSON.parse(fs.readFileSync(prof_json).toString())
   var prof_abi  = foo['abi']
} catch (err) {
    console.log('file error with contract json ABI descriptions: ' + err)
    return
}


var us = readlineSync.question('enter Our address:')
var praddr = readlineSync.question('enter Profile address:')
var current_data = readlineSync.question('enter current profile data:')
var kecc_curr = sha3.keccak256(current_data)
console.log("Hash of data:" + kecc_curr)
var profiledata = readlineSync.question('enter new data to be hashed:')
var kecc_new = sha3.keccak256(profiledata)

pt.timeout(web3.eth.personal.unlockAccount(us,pass),short_time).then(step2).catch(err)

function step2() {
    // connect to given Profile
    var profile_c = new web3.eth.Contract(prof_abi,praddr)
    if (profile_c==null) {
        console.log("Profile not found at " + praddr)
        return
    }
    // console.log(JSON.stringify(profile_c))

    // list Profile details

    profile_c.methods.getChecksum().call({from: us}, function(error, result){
        if (error) { console.log(error); return }
        console.log("Current kecc: " + result)
        console.log("Trying to update kecc...")
        
    });

    // see if current data matches, then update new data
}