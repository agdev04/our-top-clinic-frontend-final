'use client'
import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client';
import Peer from 'peerjs';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [peers, setPeers] = useState({});
  const [myStream, setMyStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const socketRef = useRef();
  const peerRef = useRef();
  const userVideoRef = useRef();
  const peersRef = useRef({});
  const roomIdRef = useRef();
  const [inputRoomId, setInputRoomId] = useState('');

  useEffect(() => {
    socketRef.current = io('http://192.168.1.45:3001', {
      transports: ['websocket']
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  const createRoom = () => {
    const newRoomId = uuidv4();
    setRoomId(newRoomId);
    roomIdRef.current = newRoomId;
    joinRoom(newRoomId);
  };

  const joinRoom = (roomId) => {
    if (!roomId) return;
    
    // Clean up any existing connections
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setMyStream(stream);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
        
        peerRef.current = new Peer();
        
        peerRef.current.on('open', (id) => {
          socketRef.current.emit('join-room', roomId, id);
          
          // Handle existing users in the room
          socketRef.current.on('existing-users', (users) => {
            users.forEach(userId => {
              const call = peerRef.current.call(userId, stream);
              call.on('stream', userStream => {
                addPeer(userId, userStream);
              });
            });
          });
        });
        
        peerRef.current.on('error', (err) => {
          console.error('Peer connection error:', err);
          alert('Failed to establish peer connection');
        });

        peerRef.current.on('call', call => {
          call.answer(stream);
          call.on('stream', userStream => {
            addPeer(call.peer, userStream);
          });
        });

        socketRef.current.on('user-connected', (userId) => {
          const call = peerRef.current.call(userId, stream);
          call.on('stream', userStream => {
            addPeer(userId, userStream);
          });
          call.on('close', () => {
            removePeer(userId);
          });
        });

        socketRef.current.on('user-disconnected', (userId) => {
          removePeer(userId);
        });
      })
      .catch(err => {
        console.error('Failed to get media devices', err);
      });
  };

  const addPeer = (peerId, stream) => {
    const newPeers = { ...peersRef.current, [peerId]: stream };
    peersRef.current = newPeers;
    setPeers(newPeers);
  };

  const removePeer = (peerId) => {
    const newPeers = { ...peersRef.current };
    delete newPeers[peerId];
    peersRef.current = newPeers;
    setPeers(newPeers);
  };

  const toggleMute = () => {
    if (myStream) {
      myStream.getAudioTracks()[0].enabled = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (myStream) {
      myStream.getVideoTracks()[0].enabled = !isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Video Call App</h1>
        
        {!roomId ? (
          <div className="flex flex-col items-center space-y-4">
            <button 
              onClick={createRoom}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create New Room
            </button>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                className="px-3 py-2 border rounded"
              />
              <button 
                onClick={() => {
                  setRoomId(inputRoomId);
                  joinRoom(inputRoomId);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Join Room
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between mb-4">
              <div className="font-medium">Room ID: {roomId}</div>
              <div className="flex space-x-2">
                <button 
                  onClick={toggleMute}
                  className={`px-3 py-1 rounded ${isMuted ? 'bg-red-500' : 'bg-gray-200'}`}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button 
                  onClick={toggleVideo}
                  className={`px-3 py-1 rounded ${isVideoOff ? 'bg-red-500' : 'bg-gray-200'}`}
                >
                  {isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black rounded-lg overflow-hidden">
                <video 
                  ref={userVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full"
                />
              </div>
              
              {Object.entries(peers).map(([peerId, stream]) => (
                <div key={peerId} className="bg-black rounded-lg overflow-hidden">
                  <video 
                    autoPlay 
                    playsInline 
                    className="w-full h-full"
                    ref={video => {
                      if (video) video.srcObject = stream;
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}