
// Common settings. Note: some instance-specific settings

var ADMIN_LANG = 'en'; // affects some default values only

var BASE_URL = "http://node1.anycase.info:8080/";  // development



// common JavaScript functions

// AJAX REST calls. Communicates mostly with. index.php
// RESPONSE: on success: direct response data from Ajax call
//           or, if no direct response, gets {"status":"ok"} (e.g. on update,delete)
//           on resurce post (insert), gets  {"status":"ok","id":newly-insert-id}
// ON FAIL: if AJAX fails, alerts HTTP status code
// ON FAIL: if backend (e.g. SQL) fails, gets back {"status":"error","message": message}

function servit_load_resource(resource_name,key,val,order,user,pass,callback) {
    var url = "/api/resource/" + resource_name;
    if (key != "") 
        url += "/"+key;
    else
        url += "/any";
    if (val != "") 
        url += "/"+val;
    else
        url += "/any";
    if (order != "")
        url += "/"+order;
    else
        url += "/any";
    $.ajax({
         url: url, 
         type: 'GET',
         contentType: 'application/json; charset=UTF-8',
         dataType: 'json',
         beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'Basic ' + btoa(user + ":" + pass)); }
         // username: user,
         // password: pass,
       }).done(callback).fail( function(xhr,text,err) {alert("Fail (1): " + JSON.stringify(xhr.status) + text + err);});
}

// load stored query 
function servit_load_query(query,param,user,pass,callback) {
    var url = "/api/qr/" + query + "/" + param;
    $.ajax({
         url: url, 
         type: 'GET',
         contentType: 'text/plain; charset=UTF-8',
         dataType: 'text',
         beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'Basic ' + btoa(user + ":" + pass)); }
     }).done(callback).fail( function(xhr,text,err) {alert("Fail (2): " + xhr.status);});
}


function servit_update_resource(resource_name,record,user,pass,callback) {
     $.ajax({
      url: "/api/resource/"+resource_name, 
      type: 'PUT', 
      contentType: 'text/plain; charset=UTF-8',
      dataType: 'text',
      beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'Basic ' + btoa(user + ":" + pass)); },
      data: JSON.stringify(record)
     }).done(callback).fail( function(xhr,text,err) {alert(xhr.status);});
}

function servit_delete_resource(resource_name,record,user,pass,callback) {
    $.ajax({
      url: "/api/resource/"+resource_name+"/"+record, 
      type: 'DELETE',
      beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'Basic ' + btoa(user + ":" + pass)); },
      success: callback});
}

function servit_insert_resource(resource_name,record,user,pass,callback) {
  $.ajax({
      url: "/api/resource/"+resource_name, 
      type: 'POST', 
      contentType: 'text/plain; charset=UTF-8',
      dataType: 'text',
      beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'Basic ' + btoa(user + ":" + pass)); },
      data: JSON.stringify(record)
     }).done(callback).fail( function(xhr,text,err) {alert(xhr.status);}); 
}

// update m:n intermediate table (remove + insert)
function servit_multi(table,master_key,master_val,slave_key,slave_array,user,pass,callback) {
    var rec = {
            table      : table,
            master_key : master_key,
            master_val : master_val,
            slave_key  : slave_key,
            slave_array: slave_array
        }
    $.ajax({
      url: "/api/multi", 
      type: 'POST', 
      contentType: 'application/json; charset=UTF-8',
      dataType: 'json',
      beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'Basic ' + btoa(user + ":" + pass)); },
      data: JSON.stringify(rec)
     }).done(callback).fail( function(xhr,text,err) {alert(xhr.status);}); 
}


// general "<select>" options from array
// call e.g. create_select_options("#select_course_type",codes,"id","code","class","coursetype",-1)
// elem_id: select-element's id; arr: array of objects; value-field name (usually "id"); option-field name; filter; selected id (-1: none)
function create_select_options(elem_id,arr,value,option,filter_field,filter_value,selected) {
     $(elem_id).children().remove();  // clear current list of options, if any
     $(elem_id).append('<option value="-1">(choose)</option>');  // add empty choice
     for (var k=0; k<arr.length; k++) {
        if (filter_field != "")
            if (arr[k][filter_field] != filter_value) continue;
        // console.log(k+":"+arr[k][value]+":"+arr[k][option]);
        if (arr[k][value] == selected)
            $(elem_id).append('<option selected value="'+arr[k][value]+'">'+arr[k][option]+'</option>');
        else
           $(elem_id).append('<option value="'+arr[k][value]+'">'+arr[k][option]+'</option>');
     }
}       


// check field rules under insert/update
function rules_check(rules) {
    var ok = true;
    var msg = "";
    for (var r=0; r< rules.length; r++) {
        // $("#".rules[r][1]).val($("#".rules[r][1]).val().trim());  // remove leading/trailing whitespaces etc.
        var val = $("#"+rules[r][1]).val();   // get cleaned value
        if (rules[r][2] == "required") {  // apply rules
            if ((rules[r][3] == "string") && (val == "")) { ok = false; msg += "error: required: " + rules[r][0] +"\n"; } 
            if ((rules[r][3] == "number") && (isNaN(val)) || (val=="")) { ok = false; msg += "error: not a number: " + rules[r][0] +"\n"; }
            if ((rules[r][3] == "date")   && (isNaN(Date.parse(val))) || (val == "")) {ok = false; msg += "error: required: " + rules[r][0] +"\n"; }
        }
        else
            if (val == "") $("#"+rules[r][1]).val(rules[r][4]);
    }
    if (!ok) alert(msg);
    return ok;
}

function servit_mail(msg,user,pass,callback) {
     $.ajax({
      url: "/api/mail", 
      type: 'POST', 
      contentType: 'application/json; charset=UTF-8', 
      dataType: 'json',
      data: JSON.stringify(msg),
      beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'Basic ' + btoa(user + ":" + pass)); }
     }).done(callback).fail( function(xhr,text,err) {alert(xhr.status);}); 
}



function servit_load_lang(page,lang,user,pass,lang_callback) {
    var url = "/api/resources/Code/" ;
    var term = "class='z' and lang='"+lang+"' and code like '"+page+"%'";
    term = encodeURIComponent(term);
    var url = "/api/resources/Code/"+term+"/code";
    $.ajax({
         url: url, 
         type: 'GET',
         contentType: 'application/json; charset=UTF-8',
         dataType: 'json',
         beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'Basic ' + btoa(user + ":" + pass)); }
       }).done(function(data) {
                   // form associative array of labels              
                   var labels = {};
                   for (var i=0; i<data.length; i++) labels[data[i].code] = data[i].label;
                   // loop "span" elements on current page. If span with id matching label id is found, replace html contents.
                   $('span').each(function(index,value) { 
                       if (labels.hasOwnProperty($(this).attr('id'))) 
                          $(this).html(labels[$(this).attr('id')]);  
                   });    
                   lang_callback(labels);  // report label array back
               }).fail( function(xhr,text,err) {alert("Fail (1): " + JSON.stringify(xhr.status) + text + err);});
}


// assume we have an array with objects with "id" field. Return object with id, or null.
function obj_by_id(arr,id) {
    var found = false;
    var i = 0;
    while (!found && (i < arr.length)) 
        if (arr[i].id == id) found=true; else i++;
    if (found)
        return(arr[i])
    else
        return null;
}

// assume we have an array with objects with "id" field. Return array index with matching id, or -1.
function index_by_id(arr,id) {
    var found = false;
    var i = 0;
    while (!found && (i < arr.length)) 
        if (arr[i].id == id) found=true; else i++;
    if (found)
        return(i)
    else
        return -1;
}


// return value from Code list
function code_value(codes,cclass,code,lang) {
   for (var i=0; i<codes.length; i++)
       if (lang != "")
           if ((codes[i].class == cclass) && (codes[i].code == code) && (codes[i].lang==lang)) return(codes[i].label);
           else;
       else
           if ((codes[i].class == cclass) && (codes[i].code == code)) return(codes[i].label);
    return "";
}


