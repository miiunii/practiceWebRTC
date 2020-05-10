'use strict'
$(document).ready(makeRoom)

// $('#make').on('click', makeRoom)

function askName() {
    $('#room').hide();
    $('#displayId').hide();
    $('#hangout').hide();
    $('#localVideo').hide();
    $('#placeLocal').hide();
    $('#placeRemote').hide();
}

async function makeRoom() {
    let room = await $('#roomName').val();
    $('#room').hide();
    $('#displayId').hide();
    $('#hangout').hide();
    $('#localVideo').show();
    $('#placeLocal').hide();
    $('#placeRemote').hide();
    $('#askRoomName').hide();
    $('#roomName').hide();
    $('#make').hide();

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

    let peer = new Peer('skkrypto', { key: 'lwjd5qra8257b9' });
    let conn;
    let userId; // 참여 원하는 사람 id 값

    peer.on('open', (id) => {
        document.getElementById("displayId").innerHTML = peer.id
    })

    // try to connect
    function connecting() {
        let peerId = userId;
        conn = peer.connect(peerId, { label: 'room' });

        // connect 할 때 user 로 보내는 값 (3)
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

    // try to shutdown
    function shutDown() {
        peer.destroy();
    }

    // listen connecting
    peer.on('connection', (connection) => {

        // user 에서 보내는 id 값 받는 곳 (1)
        connection.on('data', (data) => {
            // user id 받음
            let join = confirm(data + ' 참여하길 원합니다');
            userId = data;
            if (join === true) {
                connecting();
                connection.send({perm: 'allow', name: room})
            } else {
                alert('거절하셨습니당')
                connection.send({perm: 'refuse', name: room})
            }
        })

        // 받을 때 되돌려주는 값 (2)
        connection.on('open', () => {
            console.log('connection success 1')
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

    // 연결 끊기
    $('#hangout').on('click', shutDown);
}