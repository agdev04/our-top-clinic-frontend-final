import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type Message = {
  user_id: string;
  action: string;
  target_user?: string;
  sdp?: string;
  candidate?: string;
};

// type PresenceUpdate = {
//   type: string;
//   users: string[];
// };

interface VideoCallProps {
  appointmentId: string;
  userId: string;
}

export default function VideoCall({ appointmentId, userId }: VideoCallProps) {
  const { getToken } = useAuth();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [_remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [usersInCall, setUsersInCall] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Authentication required');
        
        const wsUrl = `${import.meta.env.VITE_WS_BASE_URL}/ws/presence/${appointmentId}?token=${token}`;
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          console.log('WebSocket connection established');
        };
        
        wsRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'presence_update') {
            setUsersInCall(data.users);
          } else {
            handleSignalingMessage(data);
          }
        };
        
        wsRef.current.onclose = () => {
          // Clean up
          if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
          }
          setIsCallActive(false);
        };
        
        return () => {
          if (wsRef.current) {
            wsRef.current.close();
          }
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to setup WebSocket');
      }
    };
    
    setupWebSocket();
  }, [appointmentId, getToken]);
  
  // Initialize local media stream
  useEffect(() => {
    const getLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        return () => {
          stream.getTracks().forEach(track => track.stop());
        };
      } catch (err) {
        setError('Could not access camera/microphone');
      }
    };
    
    getLocalStream();
  }, []);
  
  const handleSignalingMessage = (message: Message) => {
    if (!pcRef.current) return;
    
    switch (message.action) {
      case 'offer':
        handleOffer(message);
        break;
      case 'answer':
        handleAnswer(message);
        break;
      case 'ice_candidate':
        handleICECandidate(message);
        break;
    }
  };
  
  const handleOffer = async (message: Message) => {
    if (!pcRef.current || !message.sdp) return;
    
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp: message.sdp
      }));
      
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      
      wsRef.current?.send(JSON.stringify({
        user_id: userId,
        action: 'answer',
        target_user: message.user_id,
        sdp: answer.sdp
      }));
    } catch (err) {
      setError('Failed to handle offer');
    }
  };
  
  const handleAnswer = async (message: Message) => {
    if (!pcRef.current || !message.sdp) return;
    
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: message.sdp
      }));
    } catch (err) {
      setError('Failed to handle answer');
    }
  };
  
  const handleICECandidate = (message: Message) => {
    if (!pcRef.current || !message.candidate) return;
    
    try {
      pcRef.current.addIceCandidate(new RTCIceCandidate({
        candidate: message.candidate,
        sdpMid: '0',
        sdpMLineIndex: 0
      }));
    } catch (err) {
      setError('Failed to add ICE candidate');
    }
  };
  
  const startCall = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');
      
      // Check WebSocket connection state before proceeding
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket connection not ready');
      }
      
      // Send join message
      wsRef.current.send(JSON.stringify({
        user_id: userId,
        appointment_id: appointmentId,
        action: 'join'
      }));
      
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;
      
      // Add local stream to peer connection
      if (localStream) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });
      }
      
      // Handle remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setRemoteStream(event.streams[0]);
        }
      };
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          wsRef.current?.send(JSON.stringify({
            user_id: userId,
            appointment_id: appointmentId,
            action: 'ice_candidate',
            target_user: usersInCall.find(u => u !== userId),
            candidate: event.candidate.candidate
          }));
        }
      };
      
      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      wsRef.current?.send(JSON.stringify({
        user_id: userId,
        action: 'offer',
        target_user: usersInCall.find(u => u !== userId),
        sdp: offer.sdp
      }));
      
      setIsCallActive(true);
    } catch (err) {
      setError('Failed to start call');
    }
  };
  
  const endCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    setRemoteStream(null);
    setIsCallActive(false);
    
    // Send leave message
    getToken().then(token => {
      wsRef.current?.send(JSON.stringify({
        user_id: token,
        action: 'leave'
      }));
    });
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto mt-10">
      <CardHeader>
        <CardTitle>Video Consultation</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-600 bg-red-100 p-4 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-lg font-medium mb-2">{userId === appointmentId ? 'Provider Video' : 'Your Video'}</h3>
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-auto rounded-lg border"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">{userId === appointmentId ? 'Patient Video' : "Provider's Video"}</h3>
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-auto rounded-lg border"
            />
          </div>
        </div>
        
        <div className="flex justify-center gap-4">
          {!isCallActive ? (
            <Button onClick={startCall} disabled={usersInCall.length < 2}>
              Start Call
            </Button>
          ) : (
            <Button variant="destructive" onClick={endCall}>
              End Call
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}