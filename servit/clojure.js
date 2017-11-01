var pt   = require('promise-timeout'); 
var bar = 'Y'

function foo() {
   var bar = 'X' 
   pt.timeout(laske(),10)
       .then(out)
       .catch(function(err) {
            console.log("erhe " + err)
            console.log("bar : " + bar) })
}


function out(tulos) {
    console.log("tulos on " + tulos)
    console.log("bar : " + bar)
}

function laske() {
    var x
    for (var i=0; i < 10000000; i++) x = Math.sin(i)
    return x
}

foo()