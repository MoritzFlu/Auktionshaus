window.addEventListener("load", function(){

    document.querySelector('input[type="file"]').addEventListener('change', function() {
        if (this.files && this.files[0]) {
            var img = document.querySelector('img');  // $('img')[0]
            img.src = URL.createObjectURL(this.files[0]); // set src to blob url
            img.onload = imageIsLoaded;
        }
    });

    document.getElementById("auct_create").onclick = function () {
        var fd = new FormData();
        var files = $('#file')[0].files[0];
        fd.append('file',files);
        $.ajax({
            url: '/upload',
            data: fd,
            cache: false,
            contentType: false,
            processData: false,
            method: 'POST',
            type: 'POST',
            success: function(data){
                var a_data = {
                    "name": document.getElementById("auct_name").value,
                    "desc": document.getElementById("auct_desc").value,
                    "cat": document.getElementById("auct_cat").value,
                    "state": document.getElementById("auct_state").value,
                    "bid": document.getElementById("auct_bid").value,
                    "imagename": data
                }
                $.ajax({
                    url: '/createauct',
                    data: a_data,
                    type: 'POST',
                    dataType:'application/json',
                    success: function(response){
                      window.alert(response)
                    },
                    error: function(error) {
                        //window.alert("ERROR: Couldn't create auction!")
                    }
                });
            },
            error: function(error){
                alert("Failed to upload Image!");
            }
        });
    };
});

let place_bid = function(auctid) {
    let id = "bidval_" + auctid;
    var a_data = {
        "bid": document.getElementById(id).value,
        "auctid": auctid
    };
    $.ajax({
        url: '/placebid',
        data: a_data,
        type: 'POST',
        dataType:'application/json',
        success: function(response){
          window.alert(response)
        },
        error: function(error) {
            //window.alert("ERROR: Couldn't create auction!")
        }
    });
};
