
    var sel = 0;      // selected activity
    var max_sel = 3;  // max activities
    
    var codes;        // array for all codes (table: Code)
    var services;     // array for all services
    
    var user = "foo";
    var pass = "bar";
    
    var error = "";
    var init_step = 0; 

    var profile_id = -1;   // current user profile id
    
    // GLOBAL: init page
    $(function() {
        // global
        selection(0);  // pre-select login page
        
        // section-specific init:
        // 0.profile
        $("#profile_button2").hide();
        // 1.service
        $("#service_actions2").hide();
        // 2.contract
        $("#contract_actions2").hide();
        // 3.delivery
		$("#delivery_actions2").hide();
        
    });


    // global: show selected activity, hide others
    function selection(i) {
        // console.log("We have selection "+ i + " and user " + user);
        if (user == "") i=0;
        for (var k=0; k<=max_sel; k++)
            $("#section"+k).hide();
        $("#section"+i).show();
        // current section in sel, new section in i
        // 
        sel = i;
        // ensure updated select-lists in other pages
        if (i==3) {   // persons
            // new persons can be received from outside; refresh list
			/*
            servit_load_resource("Person","","organization,surname,firstname",user,pass,refresh_profiles); 
            create_select_options("#profile_quiz",quizes,"id","title","","",-1);
			*/
            
        }
       
        if (i==4) { /*
            create_category_options("#qz_cats",categories,"id","path","Osaamisalue//",-1);
            create_select_options("#qz_list",quizes,"id","title","","",-1);
            create_select_options("#qz_certificate",codes,"code","code","class","cert_image",-1);
            create_select_options("#qz_survey",surveys,"id","title","","",-1);
            // create_select_options("#qz_course",courses,"id","name","","",-1);
            // question query section
            create_select_options("#q_search_quiz",quizes,"id","title","","",-1);
            create_category_options("#q_search_cat",categories,"id","path","Osaamisalue//",-1);
            // question section
            create_select_options("#q_quizes",quizes,"id","title","","",-1);
            create_category_options("#q_cats",categories,"id","path","Osaamisalue//",-1);
            
             // initialize multi-selects
             $('#qz_cats').multipleSelect();
             $('#q_quizes').multipleSelect();
             $('#q_cats').multipleSelect();
			 */
            
        }    
    }


    function login() {
       $.ajax({
         url: "/api/resource/Profile/email/"+encodeURIComponent($("#user").val())+"/any",
         type: 'GET',
         beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'Basic ' + btoa($("#user").val() + ":" + $("#pass").val())); },
         // username: $("#user").val(),
         // password: $("#pass").val()
       }).done(login_callback).fail( function(xhr,text,err) {alert("Fail (3): " + xhr.status);});
    }

    var init_step = 0;  // use these to enforce sequential load of resources (Quiz requires existing codes, categories..)
                        // using Promises would be a more elegant solution

    function login_callback() {
         user = $("#user").val();
         pass = $("#pass").val();
         console.log("login callback done: we got " + user + " " + pass);
         // get user profile details first
         servit_load_resource("Profile","email",user,"",user,pass,function(data) {
             // display current user data
             var rec = data[0];
             profile_id = rec.id;    // save global profile_id
             $("#profile_first").val(rec.firstname);
             $("#profile_last").val(rec.lastname);
             $("#profile_email").val(rec.email);
             $("#profile_tel").val(rec.tel);
             $("#profile_company").val(rec.company);
             $("#profile_eth").val(rec.eth);
             // modify page
             $("#login").hide();
             $("#profile_label").html("Your profile");
             $("#passlabel").html("new password (opt.)");
             $("#profile_button1").hide();
             $("#profile_button2").show();
             init_step = 0;
             initial_load_sequence();  // continue to load other resources
             // start refreshing monitor window
             document.getElementById('monitor').src='/monitor/'+profile_id
         });
         
               
    }

    function initial_load_sequence() {   // "Promises" would be a more elegant way
        if (init_step == 2) return;  // so far
        init_step++;
        if (init_step == 1) servit_load_resource("Code","","","class,code",user,pass,refresh_codes);  // each "refresh.." calls back inital_load_sequence
        if (init_step == 2) servit_load_resource("Service","","","role,title",user,pass,refresh_services);
        if (init_step == 3) servit_load_resource("Contract","","","",user,pass,refresh_contract);
        if (init_step == 4) servit_load_resource("Delivery","","","",user,pass,refresh_delivery);
    }
    
    function refresh_codes(data) {
        codes = data;
        create_select_options("#service_type",codes,"code","label","class","service_type",-1)
        create_select_options("#myservice_type",codes,"code","label","class","service_type",-1)
        initial_load_sequence();
    }

    function refresh_services(data) {
        services = data;
        // console.log(JSON.stringify(codes));
        var html=""
        var remove = "";
        for (var i=0; i<services.length; i++) {
            html+='<tr><td>'+services[i].role+'</td><td>'+services[i].title+'</td><td>'+code_value(codes,'service_type',services[i].type,"")+
                       '</td><td>'+services[i].keywords+'</td><td>'+services[i].profile_id;
            if (profile_id == services[i].profile_id) html += ' <a href="#" onClick="service_remove(' + services[i].id + ')">DEL</a>';
            html += "</td></tr>";
        }
        $("#service_rows").html(html);
        initial_load_sequence();
    }
    


    function logout() {
         user = "";
         pass = "";
         selection(0);
         window.location.href="/";  // re-enter page, easiest way to clean all
    }

    
   // SECTION: Login / Profile  ----------------------------------------------------------------------------------------------------------------

    // section status object for: profile
    var status_profile = {
        data  : { id   :-1,
                  firstname:"",
                  lastname:"",
                  email:"",
                  tel:"",
                  company:"",
                  eth:"",
                  pass1:"",
                  pass2:""
                },
        // collect data from UI
        get_data : function() {
                     this.data.firstname = $("#profile_first").val();
                     this.data.lastname = $("#profile_last").val();
                     this.data.email = $("#profile_email").val();
                     this.data.tel = $("#profile_tel").val();
                     this.data.company = $("#profile_company").val();
                     this.data.eth = $("#profile_eth").val();
                     this.data.pass1 = $("#profile_pass1").val();
                     this.data.pass2 = $("#profile_pass2").val();
                 },
        // put data to UI
        show_data : function() {
                     $("#profile_first").val(this.data.firstname);
                     $("#profile_last").val(this.data.lastname);
                     $("#profile_email").val(this.data.email);
                     $("#profile_tel").val(this.data.tel);
                     $("#profile_company").val(this.data.company);
                     $("#profile_eth").val(this.data.eth);
                     $("#profile_pass1").val('');
                     $("#profile_pass2").val('');
                 },
        rules: [["last name ","profile_last","required","string",""],
                ["email ","profile_email","required","string",""],
                ["Ethereum address ","profile_eth","required","string",""],
               ],
        // setting basic state
        reset : function() {
                    // clear fields
                    this.data.id=-1;
                    this.data.firstname="";
                    this.data.lastname="";
                    this.data.email="";
                    this.data.tel="";
                    this.data.company="";
                    this.data.eth="";
                    this.data.pass1="";
                    this.data.pass2="";
                    this.show_data();
                    this.status="new";
                   
                }
    }  // end status_profile  
    
    
    function refresh_profile(data) {
        users = data;
        // console.log("Person count: " + data.length);
        var html = "";
        for (var i=0; i<data.length; i++) {
            // generate table body
            
            html += "<td>"+data[i].firstname+" "+data[i].surname+'</td><td>'+data[i].organization+
                    '</td><td><a href="#" onClick="edit_profile(' + i + ')">edit</a></td><td><input type="checkbox" value="x" id="inv'+i+'"/></td></tr>';
        }
        $("#profile_rows").html(html);
        initial_load_sequence();  
    }
    
    // update or delete user
    function profile_update(action) {
        if (! rules_check(status_profile.rules)) return;
        status_profile.get_data();
        if (action=="delete") 
            if (!$("#profile_delete_check").is(':checked')) {   // safety checkbox test
               alert("delete:check");
               return;
            } else {
               servit_delete_resource("Profile",users[status_profile.current],user,pass,function() {
                    // reload from database and display
                    servit_load_resource("Profile","","organization,surname,firstname",user,pass,refresh_profiles);
                    status_profile.reset();
               });           
            }
        if (action== "update") {
           // construct record to be updated
           var rec = {};
           rec.firstname=status_profile.data.firstname;
           rec.lastname=status_profile.data.lastname;
           rec.email=status_profile.data.email;
           rec.tel=status_profile.data.tel,
           rec.company=status_profile.data.company;
           rec.eth=status_profile.data.eth;
           // see if there is a new password
           if (status_profile.data.pass1 != "") {
               if (status_profile.data.pass1.length < 8) { alert("password must contain min 8 characters"); return; } 
               if (status_profile.data.pass1 != status_profile.data.pass2) { alert("error: passwords do not match"); return; }
               rec.passhash = sha256(status_profile.data.pass1)
           }    
           servit_update_resource("Profile",rec,user,pass,function() {
                alert("profile updated");
           });
        }
        
    }
    
    // insert new user
    function profile_insert() {
       if (! rules_check(status_profile.rules)) return;
       status_profile.get_data();
       // construct record to be inserted
       var rec = {
             firstname:status_profile.data.firstname,
             lastname:status_profile.data.lastname,
             email:status_profile.data.email,
             tel:status_profile.data.tel,
             company:status_profile.data.company,
             eth:status_profile.data.eth,
             pass:status_profile.data.pass1  // not hashed yet
       };
       // see if we have a proper new password
       if (status_profile.data.pass1.length < 8) { alert("password must contain min 8 characters"); return; } 
       if (status_profile.data.pass1 != status_profile.data.pass2) { alert("error: passwords do not match"); return; }
       $.ajax({
          url: "/api/newprofile", 
          type: 'POST', 
          contentType: 'text/plain; charset=UTF-8',
          dataType: 'text',
          data: JSON.stringify(rec)
       }).done(function(data) { 
            status_profile.reset();
            alert(data);
            
            alert("Please check your email for confirmation (TO DO), and log in with your email and password.");
       }).fail( function(xhr,text,err) {alert(xhr.status);}); 
      
    }

// END SECTION: Profile -----------------------------------------------------------------

// SECTION: Services

// section status object for: service
var status_service = {
        id : -1,
        status : "new",
        data  : { id   :-1,
                  role:"",
                  title:"",
                  type:"",
                  profile_id:"",
                  keywords:"",
                  description:"",
                  area:""
                },
        // collect data from UI
        get_data : function() {
                     this.data.role = $('input[name=myservice_role]:checked').val();
                     this.data.title = $("#myservice_title").val();
                     this.data.type = $("#myservice_type").val();
                     this.data.keywords = $("#myservice_keywords").val();
                     this.data.description = $("#myservice_description").val();
                     this.data.area = $("#myservice_area").val();
                 },
        // put data to UI
        show_data : function() {
                      if (this.data.role == "available") $('#sr1').prop('checked', true); else $('#sr2').prop('checked', true);
                      $("#myservice_title").val(this.data.title);
                      $("#myservice_type").val(this.data.type);
                      $("#myservice_keywords").val(this.data.keywords);
                      $("#myservice_description").val(this.data.description);
                      $("#myservice_area").val(this.data.area);
                 },
        rules: [["title ","service_title","required","string",""]
               ],
        // setting basic state
        reset : function() {
                    // clear fields
                    this.data.id=-1;
                    this.data.role="available";
                    this.data.type=-1;
                    this.data.title="";
                    this.data.keywords="";
                    this.data.area="";
                    this.data.description="";
                    this.data.profile_id=-1;
                    this.status="new";
                    this.show_data()
                }
    }  // end status_service  

    function service_insert() {
       if (! rules_check(status_service.rules)) return;
       status_service.get_data();
       // construct record to be inserted
       var rec = {
             role:status_service.data.role,
             type:status_service.data.type,
             title:status_service.data.title,
             keywords:status_service.data.keywords,
             area:status_service.data.area,
             description:status_service.data.description,
             profile_id:profile_id
       };
       servit_insert_resource("Service",rec,user,pass,function(data) {
          servit_load_resource("Service","","","role,title",user,pass,refresh_services);
          status_service.reset();
       }); 
    }

    function service_remove(sid) {
        servit_delete_resource("Service",sid,user,pass,function(data) {
            servit_load_resource("Service","","","role,title",user,pass,refresh_services);
        });   
    }

// END SECTION: Services ----------------------------------------------------------------



