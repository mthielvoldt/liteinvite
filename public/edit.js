

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

  // document.getElementById('imageUploadBtn').addEventListener('click', function (e) {
  //   e.preventDefault();
  //   var fileName = document.getElementById("meetupImageInput").files[0].name;
  //   document.body.style.backgroundImage = 'url("/images/'+ filename + '")';
  // });