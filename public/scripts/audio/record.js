function restore(){
    $("#record, #live").removeClass("disabled");
    $("#pause").replaceWith('<a class="button one" id="pause">Pause</a>');
    $(".one").addClass("disabled");
    Fr.voice.stop();
}

function makeWaveform(){
    var analyser = Fr.voice.recorder.analyser;

    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    /**
     * The Waveform canvas
     */
    var WIDTH = 500,
        HEIGHT = 200;

    var canvasCtx = $("#level")[0].getContext("2d");
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    function draw() {
        var drawVisual = requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        canvasCtx.beginPath();

        var sliceWidth = WIDTH * 1.0 / bufferLength;
        var x = 0;
        for(var i = 0; i < bufferLength; i++) {
            var v = dataArray[i] / 128.0;
            var y = v * HEIGHT/2;

            if(i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }
        canvasCtx.lineTo(WIDTH, HEIGHT/2);
        canvasCtx.stroke();
    };
    draw();
}

$(document).ready(function(){
    $(document).on("click", "#record:not(.disabled)", function(){
        console.log("record clicked");
        $(this).hide();
        $("#base64").show();
        $(".control-panel-hint").css("color", "Red");
        $(".control-panel-hint").text("Click the above button to stop recording");
        Fr.voice.record($("#live").is(":checked"), function(){
            $(".recordButton").addClass("disabled");
            $("#live").addClass("disabled");
            $(".one").removeClass("disabled");
            makeWaveform();
        });
    });
    $(document).on("click", "#base64:not(.disabled)", function(){
        console.log("base64 clicked");
        $(this).hide();
        $("#record").show();
        $("#audio-controls").attr("src", "");
        $(".control-panel-hint").css("color", "Green");
        $(".control-panel-hint").text("Click the above button to start recording");
        $(".active-note-transcript").text("Processing...refresh or check back later!");
        if ($(this).parent().data("type") === "mp3") {
            Fr.voice.exportMP3(function(url){
                var base64AudioInfo = {
                    userId: $(".active-user-id").val(),
                    noteId: $(".note-interface:visible > .active-note-id").val(),
                    base64URL: LZString.compressToEncodedURIComponent(url)
                };
                socket.emit("set base64 audio", base64AudioInfo);
                $("<a href='"+ url +"' target='_blank'></a>")[0].click();
            }, "base64");
        }
        else {
            Fr.voice.export(function(url){
                var base64AudioInfo = {
                    userId: $(".active-user-id").val(),
                    noteId: $(".note-interface:visible > .active-note-id").val(),
                    base64URL: LZString.compressToEncodedURIComponent(url)
                };
                socket.emit("set base64 audio", base64AudioInfo);
                $("<a href='"+ url +"' target='_blank'></a>")[0].click();
            }, "base64");
        }
        $(".active-note-transcript").attr("placeholder", "Processing...refresh or check back later!");
        $(".btn-audio").remove();
        $(".control-panel-hint").hide();
        restore();
        var noteInfo = {
            userId: $(".active-user-id").val(),
            noteId: $(".note-interface:visible > .active-note-id").val()
        };
        socket.emit("get note reduction", noteInfo);
        $("#control-panel-reduction").show();

    });
/*
    $(document).on("click", "#recordFor5:not(.disabled)", function(){
        Fr.voice.record($("#live").is(":checked"), function(){
            $(".recordButton").addClass("disabled");

            $("#live").addClass("disabled");
            $(".one").removeClass("disabled");

            makeWaveform();
        });

        Fr.voice.stopRecordingAfter(5000, function(){
            alert("Recording stopped after 5 seconds");
        });
    });

    $(document).on("click", "#pause:not(.disabled)", function(){
        if($(this).hasClass("resume")){
            Fr.voice.resume();
            $(this).replaceWith('<a class="button one" id="pause">Pause</a>');
        }else{
            Fr.voice.pause();
            $(this).replaceWith('<a class="button one resume" id="pause">Resume</a>');
        }
    });

    $(document).on("click", "#stop:not(.disabled)", function(){
        restore();
    });

    $(document).on("click", "#play:not(.disabled)", function(){
        if($(this).parent().data("type") === "mp3"){
            Fr.voice.exportMP3(function(url){
                $("#audio").attr("src", url);
                $("#audio")[0].play();
            }, "URL");
        }else{
            Fr.voice.export(function(url){
                $("#audio").attr("src", url);
                $("#audio")[0].play();
            }, "URL");
        }
        restore();
    });


    $(document).on("click", "#download:not(.disabled)", function(){
        if($(this).parent().data("type") === "mp3"){
            Fr.voice.exportMP3(function(url){
                $("<a href='" + url + "' download='MyRecording.mp3'></a>")[0].click();
            }, "URL");
        }else{
            Fr.voice.export(function(url){
                $("<a href='" + url + "' download='MyRecording.wav'></a>")[0].click();
            }, "URL");
        }
        restore();
    });
*/

});
