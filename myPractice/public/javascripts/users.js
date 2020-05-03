'use strict'

/////////////////////////////////////////////////////////////////
////////////////////////// webRTC PART /////////////////////////
///////////////////////////////////////////////////////////////

let localStream;
let remoteStream;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

const constraints = {
    video: true,
    audio: false
};

// STUN server config
const pcConfig = {
    'iceServers': [
        { 'urls': 'stun:stun.l.google.com:19302' },
        { 'urls': 'stun:stun.services.mozilla.com' }
    ]
};

// check if the browser supports the WebRTC
function hasLocalMedia() {
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
}

// get media
function recStream(stream, elemid) {
    let video = document.getElementById(elemid);

    video.srcObject = stream;
    remoteStream = stream;
}

// get local media
function getLocalStream(stream) {
    localStream = stream;
    recStream(stream, 'localVideo');
}

// Handles error by logging a message to the console with the error message.
function handleLocalMediaStreamError(error) {
    console.log('navigator.getUserMedia error: ', error);
}

if (hasLocalMedia()) {

    // enabling video and audio channels
    navigator.mediaDevices.getUserMedia(constraints)
        .then(getLocalStream)
        .catch(handleLocalMediaStreamError)

} else {
    alert('webRTC is not supported!')
}


/////////////////////////////////////////////////////////////////
////////////////////////// peerJS PART /////////////////////////
///////////////////////////////////////////////////////////////

let peer = new Peer({ key: 'lwjd5qra8257b9' });

peer.on('open', (id) => {
    document.getElementById("displayId").innerHTML = peer.id
    console.log(id)
})

// try to connect
function connecting() {
    let peerId = $('.roomId').val();
    let conn = peer.connect(peerId, {label: 'room'});
    
    // room 으로 보내는 값 (2)
    conn.on('open', () => {
        conn.send(peer.id);
    })

    // connect 시에 room 으로 부터 데이터 받는 곳 (3)
    conn.on('data', (data) => {
        console.log('1 ', data);
    })
}

// listen connecting
peer.on('connection', (connection) => {
    console.log('connection' , connection)
    
    // room 으로 부터 응답 올 때 받는 값 (1)
    connection.on('data', (data) => {
        if (data === "room is ready") {
            navigator.getUserMedia(constraints, (stream) => {
                var call = peer.call(connection.peer, stream);
                call.on('stream', (stream) => {
                    remoteStream = stream;
                    recStream(remoteStream, 'remoteVideo')
                })
            })
        } else {
            alert('connecting error 1');
        }
    })

    // room 으로 부터 응답 올 때 주는 값 (4)
    connection.on('open', () => {
        connection.send('user is ready');
    })
})

// 전화 대기
peer.on('call', (call) => {
    call.answer(localStream);
    call.on('stream', (stream) => {
        remoteStream = stream;
        recStream(stream, 'remoteVideo')
    })
})

$('.enter').on('click', connecting)
