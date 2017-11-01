var readlineSync = require('readline-sync');

var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
// here we introduce the ABI interface description
var myContract = new web3.eth.Contract([{"constant":true,"inputs":[],"name":"getData","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_data","type":"string"}],"name":"setData","outputs":[],"payable":false,"type":"function"},{"inputs":[{"name":"_data","type":"string"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"d","type":"string"}],"name":"dataEvent","type":"event"}]);
var acc = '0x4eCBc12039603CF66aeCa6A7888feD8955D8B2F9' // use this account
var pass = 'mypass'  // password for account above
web3.personal.unlockAccount(acc,pass)  // unlock account for default time
myContract.deploy({   // the compiled contract code, pasted from the online compiler
    data: '0x6060604052341561000f57600080--terribly-long-string', 
    arguments: ['Initial string']   // constructor parameters
})
.send({      // who creates the contract and pays the bill
    from: '',
    gas: 1500000,
    gasPrice: '30000000000000'
}, function(error, transactionHash){ 
     if (error) console.log("Error (0) " + error); 
     else console.log("TX hash " + transactionHash); 
})
.on('error', function(error) { console.log("Deploy error " + error) })
.on('transactionHash', function(transactionHash){ 
    console.log("Deploy transaction hash: " + transactionHash) })
.on('receipt', function(receipt){
    console.log("Success : contract address is " + receipt.contractAddress) // contains the new contract address
})
.on('confirmation', function(confirmationNumber, receipt){ 
   console.log("Confirmations received: " + confirmationNumber) })
.then(function(newContractInstance){
    console.log("Contract instance established, address " + newContractInstance.options.address) // instance with the new contract address
});
                                    
/*
pragma solidity ^0.4.14;
contract Somedata {
   string data;
   address owner;

   event dataEvent(string d);
   
   function kill() { 
      if (msg.sender == owner) suicide(owner); 
   }  
   function Somedata(string _data) {
       owner = msg.sender;
	   data = _data;
   }
   function setData(string _data) {
       data = _data;
       dataEvent(data);
   }
   function getData() constant returns (string) {
	   return data;
   }
}



*/