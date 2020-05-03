'use strict'

/////////////////////////////////////////////////////////////////
////////////////////////// webRTC PART /////////////////////////
///////////////////////////////////////////////////////////////

let localStream;
let remoteStream;
let room = 'corgi';

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

let peer = new Peer(room, { key: 'lwjd5qra8257b9' });
let conn;

peer.on('open', (id) => {
    document.getElementById("displayId").innerHTML = peer.id
    console.log(id)
})

// try to connect
function connecting() {
    let peerId = $('#connId').val();
    conn = peer.connect(peerId, {label: 'room'});
    
    // connect 할 때 user 로 보내는 값 (1)
    conn.on('open', () => {
        conn.send('room is ready');
    })

    // connect user 에서 받는 값 (4)
    conn.on('data', (data) => {
        if (data === "user is ready") {
            navigator.getUserMedia(constraints, (stream) => {
                var call = peer.call(peerId, stream);
                call.on('stream', (stream) => {
                    remoteStream = stream;
                    recStream(remoteStream, 'remoteVideo')
                })
            })
        } else {
            alert('connecting error 2');
        }
    })
}

// listen connecting
peer.on('connection', (connection) => {
    console.log(connection)
    
    // user 에서 보내는 id 값 받는 곳 (2)
    connection.on('data', (data) => {
        console.log('user ' , data)
        $('#connId').val(data);
    })

    // 받을 때 되돌려주는 값 (3)
    connection.on('open', () => {
        connection.send('room is alive');
    });
});

// 전화 대기
peer.on('call', (call) => {
    call.answer(localStream);
    call.on('stream', (stream) => {
        remoteStream = stream;
        recStream(stream, 'remoteVideo')
    })
})

$('#connButton').on('click', connecting)