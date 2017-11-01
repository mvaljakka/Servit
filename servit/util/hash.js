// SHA256
var sha256 = require('sha256')
var readlineSync = require('readline-sync')
console.log(sha256(readlineSync.question('hash this:')) + "\n")
