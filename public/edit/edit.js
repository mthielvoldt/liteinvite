

document.querySelector('.custom-file-input').addEventListener('change', function (e) {
    var fileName = document.getElementById("meetupImageInput").files[0].name;
    var nextSibling = e.target.nextElementSibling
    nextSibling.innerText = fileName;
    var uploadBtn = document.getElementById("imageUploadBtn");
    uploadBtn.removeAttribute("disabled");
  });


  $(".meet-details").change( function ( event) {
    $("#upload-form input").attr("disabled", true);
    $("#upload-form label").text("Please Save changes before selecting an image");
  })

  function loadDoc() {
      alert("hey");
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        console.log("ready-state changed");
      if (this.readyState == 4 && this.status == 200) {
        document.getElementById("demo").innerHTML =
        this.responseText;
      }
    };
    xhttp.open("GET", "ajax_info.txt", true);
    xhttp.send();
  }

  // document.getElementById('imageUploadBtn').addEventListener('click', function (e) {
  //   e.preventDefault();
  //   var fileName = document.getElementById("meetupImageInput").files[0].name;
  //   document.body.style.backgroundImage = 'url("/images/'+ filename + '")';
  // });