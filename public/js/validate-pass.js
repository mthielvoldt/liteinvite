

var pass1 = document.getElementById("new-pass-1");
var pass2 = document.getElementById("new-pass-2");
var submit = document.getElementById("submit-btn");
var short = document.getElementById("pass-short");
var match = document.getElementById("pass-mismatch");

pass1.onkeyup = () => {
  if (pass1.value.length < 7) {
    submit.setAttribute("disabled", true);
    short.removeAttribute("hidden");
    match.setAttribute("hidden", true);
  } else {
    short.setAttribute("hidden", true);
    match.removeAttribute("hidden");
  }
}

pass2.onkeyup = function () {
  if (pass1.value !== pass2.value) {
    submit.setAttribute("disabled", true);
    match.removeAttribute("hidden");
    return;
  }
  if (pass2.value.length > 6) {
    submit.removeAttribute("disabled");
    short.setAttribute("hidden", true);
    match.setAttribute("hidden", true);
  }
}