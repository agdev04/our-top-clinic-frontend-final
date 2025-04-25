import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'peerjs';

export default function PatientVideoCallPage() {
  const { id: appointmentId } = useParams();
  const [peers, setPeers] = useState({});
  const [myStream, setMyStream] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const socketRef = useRef<any>(null);
  const peerRef = useRef<any>(null);
  const userVideoRef = useRef<any>(null);
  const peersRef = useRef({});
  // const roomIdRef = useRef(appointmentId);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001', {
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

  useEffect(() => {
    if (!appointmentId) return;
    
    // Clean up any existing connections
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setMyStream(stream as MediaStream);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
        
        peerRef.current = new Peer();
        
        peerRef.current.on('open', (id: any) => {
          socketRef.current.emit('join-room', appointmentId, id);
          
          // Handle existing users in the room
          socketRef.current.on('existing-users', (users: any) => {
            users.forEach((userId: string) => {
              const call = peerRef.current.call(userId, stream);
              call.on('stream', (userStream: MediaStream) => {
                addPeer(userId, userStream);
              });
            });
          });
        });
        
        peerRef.current.on('error', (err: any) => {
          console.error('Peer connection error:', err);
        });

        peerRef.current.on('call', (call: any) => {
          call.answer(stream);
          call.on('stream', (userStream: MediaStream) => {
            addPeer(call.peer, userStream);
          });
        });

        socketRef.current.on('user-connected', (userId: any) => {
          const call = peerRef.current.call(userId, stream);
          call.on('stream', (userStream: MediaStream) => {
            addPeer(userId, userStream);
          });
          call.on('close', () => {
            removePeer(userId);
          });
        });

        socketRef.current.on('user-disconnected', (userId: any) => {
          removePeer(userId);
        });
      })
      .catch(err => {
        console.error('Failed to get media devices', err);
      });
  }, [appointmentId]);

  const addPeer = (peerId: string, stream: MediaStream) => {
    const newPeers = { ...peersRef.current, [peerId]: stream };
    peersRef.current = newPeers;
    setPeers(newPeers);
  };

  const removePeer = (peerId: any) => {
    const newPeers = { ...peersRef.current };
    delete (newPeers as { [key: string]: MediaStream })[peerId];
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
        <h1 className="text-3xl font-bold text-center mb-8">Video Consultation</h1>
        
        <div>
          <div className="flex justify-between mb-4">
            <div className="font-medium">Appointment ID: {appointmentId}</div>
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
                    if (video) video.srcObject = stream as MediaStream;
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}