/*=================================
= Functions and some global vars  =
=================================*/

//global vars for typing feature
var typing = false,
    timeout;


//some jQuery methods alternatives + some helpers
function toggle(elem) {
    elem.style.display = (getComputedStyle(elem).display  === 'none') ? 'block' : 'none';
}

function show(elem) {
    elem.style.display = 'block';
}

function hide(elem) {
    elem.style.display = 'none';
}

function toggleNameForm() {
    toggle(document.getElementById("login-screen"));
}

function toggleChatWindow() {
    toggle(document.getElementById("main-chat-screen"));
}

// time in ms into HH:MM:SS
function timeFormat(ms) {
    return ((new Date()).toLocaleTimeString());
}

function empty(elem) {
    while (elem.hasChildNodes()) {
        elem.removeChild(elem.firstChild);
    }
}

//jQuery $.each()
function each( object, callback, args ) {
    var name, i = 0, length = object.length;

    if ( args ) {
        if ( length === undefined ) {
            for ( name in object )
                if ( callback.apply( object[ name ], args ) === false )
                    break;
        } else
            for ( ; i < length; )
                if ( callback.apply( object[ i++ ], args ) === false )
                    break;

    // A special, fast, case for the most common use of each
    } else {
        if ( length === undefined ) {
            for ( name in object )
                if ( callback.call( object[ name ], name, object[ name ] ) === false )
                    break;
        } else
            for ( var value = object[0];
                i < length && callback.call( value, i, value ) !== false; value = object[++i] ){}
    }

    return object;
}

/*=====  End of Functions  ======*/


// without jQuery we will use addEventListener (not working in old IEs)
document.addEventListener('DOMContentLoaded', function(){ 

    /*=================================================
    =            Settings            =
    =================================================*/
    
    var errors = document.getElementById('errors');
    var userNameInput = document.getElementById("userName");
    var msgs = document.getElementById('msgs');
    var msgInput = document.getElementById('msg');
    var people = document.getElementById('people');
    var chatForm = document.getElementById('chatForm');
    var sendButton = document.getElementById('send');

    userNameInput.focus();

    //remove default browser behavior for forms
    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i++) {
        forms[i].addEventListener('submit', function(e) {
            e.preventDefault();
        });
    }

    //user have to enter name before join chat room
    var joinChat = document.getElementById('join');
    joinChat.setAttribute('disabled', 'disabled');

    // if (userNameInput.value === "") {
    //     joinChat.setAttribute('disabled', 'disabled');
    // }
    
    var socket = io.connect('127.0.0.1:1337');

    var conversation = document.getElementById("conversation");
    conversation.addEventListener("DOMSubtreeModified",function() {
        conversation.scrollTop = conversation.scrollHeight;
    });
    
    /*=====  End of Settings  ======*/
    

    /*============================
    =            LogIn            =
    ============================*/
    
    document.getElementById("nameForm").addEventListener('submit', function() {
        var userName = userNameInput.value;
        var device = "desktop";
        if (navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i)) {
            device = "mobile";
        }
        if (userName === "" || userName.length < 2) {
            empty(errors);
            errors.innerHeight += "Please enter a name";
            show(errors);
        } else {
            socket.emit("joinserver", userName, device);
            toggleNameForm();
            toggleChatWindow();

            document.getElementById("msg").focus();
        }
    });

    //allow to join only if name is longer than 2 symbols
    userNameInput.addEventListener('keypress', function(e){
        var userName = userNameInput.value;
        if(userName.length < 2) {
            joinChat.setAttribute('disabled', 'disabled');
        } else {
            empty(errors);
            hide(errors);
            joinChat.removeAttribute('disabled');
        }
    });

    //if name already exists
    socket.on("exists", function(data) {
        empty(errors);
        var div = document.createElement('div');
        div.innerHTML = data.msg + " Try <strong>" + data.proposedName + "</strong>";
        errors.appendChild(div);
        show(errors);

        toggleNameForm();
        toggleChatWindow();
    });

    
    /*=====  End of LogIn  ======*/
    


    /*===============================
    =            Updates            =
    ===============================*/
    
    socket.on("update", function(msg) {
        var newMsg = document.createElement('li');
        newMsg.innerHTML = msg;
        msgs.appendChild(newMsg);
    });

    socket.on("update-people", function(data) {
        empty(people);
        var online = document.createElement('li');
        online.className = "list-group-item active";
        online.innerHTML = 'People online <span class="badge">' + data.count + '</span>';
        people.appendChild(online);

        each(data.people, function(a, obj) {
            var person = document.createElement('li');
            person.id = obj.name;
            person.className = "list-group-item";
            person.innerHTML = '<span>' + obj.name + '</span> <i class="fa fa-"' + obj.device + '"></i> ';
            people.appendChild(person);
        });
    });

    socket.on("show-history", function(history) {
        empty(msgs);
        var update = '';
        for (var i = 0; i < history.length; i++) {
            update += '<li>' + history[i] + '</li>';
            msgs.innerHTML = update;
        }
    });
    
    /*=====  End of Updates  ======*/
    


    /*==========================================
    =            Typing and sending            =
    ==========================================*/

    //helper for typing feature
    function clearTypingTimeout() {
        typing = false;
        socket.emit("typing", false);
    }

    msgInput.addEventListener('keypress', function(e) {
       if (e.which === 13 && e.shiftKey) { // you can send msg by shift + enter
            sendButton.click();
            msgInput.value = '';
            e.preventDefault();
       } else {
           if (!typing && msgInput === document.activeElement) {
               typing = true;
               socket.emit("typing", true);
           } else {
               clearTimeout(timeout);
               timeout = setTimeout(clearTypingTimeout, 1500);
           }
       }
    });

    socket.on("isTyping", function(data) {
        if (data.isTyping) {
            if (!document.getElementById(data.person + '_typing')) {
                var typingPerson = document.createElement('span');
                typingPerson.id = data.person + '_typing';
                typingPerson.innerHTML = '<span class="text-muted"><small><i class="fa fa-keyboard-o"></i> ' + data.person + ' is typing.</small>';
                document.getElementById(data.person).appendChild(typingPerson);
                timeout = setTimeout(clearTypingTimeout, 1500);
            }
        } else {
            if (document.getElementById(data.person + '_typing')) document.getElementById(data.person + '_typing').remove();
        }
    });

    chatForm.addEventListener('submit', function() {
        var msg = msgInput.value;
        if (msg) {
            socket.emit("send", new Date().getTime(), msg);
            msgInput.value = '';
            clearTypingTimeout();
        }
    });

    socket.on("chat", function(ms, person, msg) {
        var newMsg = document.createElement('li');
        newMsg.innerHTML = '<strong><span class="text-success">' + timeFormat(ms) + ' ' + person.name + '</span></strong>: ' + msg;

        msgs.appendChild(newMsg);
    });
    
    /*=====  End of Typing and sending  ======*/
    

    /*==================================
    =            Disconnect            =
    ==================================*/
    
    socket.on("disconnect", function() {
        var disconnectMsg = document.createElement('li');
        disconnectMsg.innerHTML = '<strong><span class="text-warning">The server is not available</span></strong>';
        msgs.appendChild(disconnectMsg);
        msgs.setAttribute("disabled", "disabled");
        sendButton.setAttribute("disabled", "disabled");
    });
    
    /*=====  End of Disconnect  ======*/
    



}, false);

