

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

// console.log(auth_abi)
// return

// collect input data
var acc = readlineSync.question('enter address for new profile:')
var profiledata = readlineSync.question('enter profile details to be hashed:')
var kecc = sha3.keccak256(profiledata)

var auth_addr     // Auth contract to be created
var profile_addr  // Profile contract to be created

pt.timeout(web3.eth.personal.unlockAccount(acc,pass),short_time).then(step2).catch(err)

function step2() {
    console.log("Introduction contracts Auth, Profile")
    var auth_c    = new web3.eth.Contract(auth_abi);
    var profile_c = new web3.eth.Contract(prof_abi);
    console.log("deploying Auth..")
    auth_c.deploy({   // the compiled contract code, pasted from the online compiler
        data: auth_solc, 
        arguments: []   // constructor parameters
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
        console.log("Success : Auth contract address is " + receipt.contractAddress)
    })
    // .on('confirmation', function(confirmationNumber, receipt){ 
    //    console.log("Confirmations received (Auth): " + confirmationNumber) })
    .then(function(new_c){
        console.log("Contract instance established, address " + new_c.options.address) // instance with the new contract address
        console.log("Proceeding to deploy the actual Profile")
        auth_addr = new_c.options.address
        deploy_profile(acc,auth_addr,profile_c)
    });
}
// We have everything for new Profile
function deploy_profile(acc,auth_addr,profile_c) {
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



