function register() {
    window.location.href = "register.html";

}

function login() {

    localStorage.removeItem("user");

    window.location.href = "login.html";

}


function dashboard() {
    // alert("Profile saved successfully!");
    window.location.href = "dashboard.html";

}


function copyrefeeralID() {
    var input = document.getElementById("refeeralID").innerText;
    input.select();
    navigator.clipboard.writeText(input);

    alert("Code copied!");

}

function Myteam() {
    window.location.href = "team.html";

}

function referal() {
    window.location.href = "referral.html";

}

function profile() {
    window.location.href = "profile.html";

}

function logout() {
    window.location.href = "logout.html";

}

function goTo(page) {
    window.location.href = page;
}
function home() {

    // localStorage.removeItem("user");

    window.location.href = "loginindex.html";

}
