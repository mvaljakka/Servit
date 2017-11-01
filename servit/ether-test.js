// Ethereum test

function callback(err,result) {
    if (err) console.log("We got err: " + err)
    else     console.log(result)
}


var readlineSync = require('readline-sync');
var Web3 = require('web3');
// var web3 = new Web3('ws://localhost:8545');

var foo = new Web3.providers.HttpProvider('http://localhost:8545');
var web3 = new Web3(foo);
// net = require('net')
// var web3 = new Web3('/home/mikko/.ethereum/geth.ipc', net);
console.log(web3.isConnected())
console.log(web3.utils.toWei(1))
// console.log(web3.eth.accounts)
web3.eth.getBalance('0x4ecbc12039603cf66aeca6a7888fed8955d8b2f9',callback)
web3.eth.getCoinbase(callback)
// web3.eth.personal.newAccount('salasana',callback)
web3.eth.getAccounts(callback);
