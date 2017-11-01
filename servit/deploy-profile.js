// console test script to deploy new Servit profile
// sequence:
// before: miner.start()
// 1. ask name, email and password.
// 2. create new address addr1. Set account password = password  (report new address)
// 3. aquire coinbase address
// 4. unlock coinbase address
// 5. send some Ether from coinbase to addr1 -> confirmation/callback (report address balance)
// 6. unlock address addr1
// 7. deploy Authorization with address addr1, role=controller = 2 
// 8. wait for confirmation : callback->contract address auth1   (report Authorization contract address auth1)
// 9. prepare profile hash/checksum
//10. unlock address addr1 (not required perhaps)
//10. deploy Profile with user details, hash/checksum, user address addr1, authorization address auth1
//11. wait for confirmation : callback -> report profile address pro1
//  outcome: new user's address addr1, profile address pro1, authorization address auth1

// coinbase password: nakamoto !!!!

var readlineSync = require('readline-sync');
var Web3 = require('web3');
var pt   = require('promise-timeout');
var fs = require('fs')

var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

var pass = 'mypassword'
var addr1
var coinbase
var basepass = 'nakamoto'

var short_time = 3*1000
var long_time  = 15*1000

function err(e) {
   console.log("Error " + e);   
}

pt.timeout(web3.eth.getCoinbase(),short_time).then(step0).catch(err)

function step0(x) {
     coinbase = x
     console.log("Coinbase is " + coinbase)
     pt.timeout(web3.eth.getBalance(coinbase),short_time).then(step1).catch(err)
}

function step1(x) {
    console.log("Coinbase has " + web3.utils.fromWei(x) + " Ether")
    pt.timeout(web3.eth.personal.newAccount(pass),short_time).then(step2).catch(err)
}


function step2(x) {
    addr1 = x
    console.log("new address " + addr1)
    pt.timeout(web3.eth.personal.unlockAccount(addr1,pass),short_time).then(step3).catch(err)
}

function step3(x) {
    console.log("unlocking.. " + x)
    console.log("Now unlocking Coinbase..")
    pt.timeout(web3.eth.personal.unlockAccount(coinbase,basepass),short_time).then(step4).catch(err)
}

function step4(x) {
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
        console.log("We got receit: " + receit)
        web3.eth.getBalance(addr1).then(function(x) {console.log("on receit: addr1 balance is " + x)})
        
    }).on('confirmation', function(cn, receipt){ 
        console.log("We got confirmation #"+cn)
         web3.eth.getBalance(addr1).then(function(x) {console.log("on confirmation: addr1 balance is " + x)})
    }).on('error', err);
}
