/*=================================
=            Functions            =
=================================*/

//немного замен для jQuery методов + несколько хелперов
function toggle(elem) {
    elem.style.display = (getComputedStyle(elem).display  === 'none') ? 'block' : 'none';
}

function show(elem) {
    elem.style.display = '';
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

// время в мс в формат HH:MM:SS
function timeFormat(ms) {
    return ((new Date()).toLocaleTimeString());
}

function empty(elem) {
    while (elem.hasChildNodes()) {
        elem.removeChild(elem.firstChild);
    }
}

/*=====  End of Functions  ======*/


// без jQuery обойдемся addEventListener (не будем учитывать старые IE)
document.addEventListener('DOMContentLoaded', function(){ 

    /*=================================================
    =            Предварительная настройка            =
    =================================================*/
    
    var errors = document.getElementById('errors');
    var userNameInput = document.getElementById("userName");
    userNameInput.focus();
    var msgs = document.getElementById('msgs');
    var people = document.getElementById('people');
    var forms = document.querySelectorAll('form');
    //уберем у форм браузреное дефолтное поведение
    for (var i = 0; i < forms.length; i++) {
        forms[i].addEventListener('submit', function(e) {
            e.preventDefault();
        });
    }

    //пока пользователь не ввел имя - войти не получится
    var joinChat = document.getElementById('join');
    joinChat.setAttribute('disabled', 'disabled');

    // if (userNameInput.value === "") {
    //     joinChat.setAttribute('disabled', 'disabled');
    // }
    
    var socket = io.connect('127.0.0.1:1337');

    var conversation = document.getElementById("conversation");
    // conversation.addEventListener("DOMSubtreeModified",function() {
    //     conversation.scrollBy(conversation.scrollHeight, 0);
    // });
    
    /*=====  End of Предварительная настройка  ======*/
    

    /*============================
    =            Вход            =
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

    //позволяем присоединиться только если имя больше 2 символов
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

    //если имя уже существует
    socket.on("exists", function(data) {
        empty(errors);
        show(errors);
        var div = document.createElement('div');
        div.innerHTML = data.msg + " Try <strong>" + data.proposedName + "</strong>";
        errors.appendChild(div);

        toggleNameForm();
        toggleChatWindow();
    });

    
    /*=====  End of Вход  ======*/
    


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
    });
    
    /*=====  End of Updates  ======*/
    




}, false);

