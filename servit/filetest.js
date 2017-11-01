var fs = require('fs')
try {
   var foo = fs.readFileSync('./servit/contract/Authorizations.json')
} catch (err) {
    console.log('file error')
    return
}
var bar = JSON.parse(foo.toString())
console.log(bar['abi'].length)
