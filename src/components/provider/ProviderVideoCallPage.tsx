import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

export default function ProviderVideoCallPage() {
  const { id: appointmentId } = useParams();
  const { userId } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [_remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!appointmentId || !userId) return;

    // Initialize WebSocket connection
    const ws = new WebSocket(`${import.meta.env.VITE_WS_BASE_URL}/ws/presence/${appointmentId}`);
    setSocket(ws);

    // Initialize WebRTC peer connection
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    setPeerConnection(pc);
    
    // Queue for ICE candidates received before remote description is set
    const iceCandidateQueue: RTCIceCandidate[] = [];

    // Handle incoming ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Local ICE candidate:', event.candidate);
        try {
          ws.send(JSON.stringify({
            user_id: userId,
            action: 'ice_candidate',
            target_user: 'patient',
            candidate: event.candidate
          }));
        } catch (error) {
          console.error('Error sending ICE candidate:', error);
        }
      } else {
        console.log('All ICE candidates have been gathered');
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteStream(event.streams[0]);
      }
    };

    // Get user media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        console.log('Local media stream obtained');
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Only add tracks if peer connection is open
        if (pc.signalingState !== 'closed') {
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
            console.log(`Added ${track.kind} track to peer connection`);
          });
        }
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
        alert('Could not access camera/microphone. Please check permissions.');
      });

    // WebSocket message handling
    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data.type);
        
        if (data.type === 'webrtc_answer') {
          if (pc.signalingState !== 'closed') {
            try {
              console.log('Setting remote description:', data.sdp);
              await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              
              // Process queued ICE candidates now that remote description is set
              while (iceCandidateQueue.length > 0) {
                const candidate = iceCandidateQueue.shift();
                if (candidate) {
                  await pc.addIceCandidate(candidate);
                }
              }
            } catch (error) {
              console.error('Error setting remote description:', error);
            }
          }
        } else if (data.type === 'webrtc_ice_candidate') {
          console.log('Remote ICE candidate received:', data.candidate);
          const candidate = new RTCIceCandidate(data.candidate);
          
          if (pc.signalingState !== 'closed' && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(candidate);
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
            }
          } else {
            // Queue candidate if remote description isn't set yet
            iceCandidateQueue.push(candidate);
            console.log('Queued ICE candidate until remote description is set');
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    // Join the call and create offer
    ws.onopen = async () => {
      ws.send(JSON.stringify({
        user_id: userId,
        action: 'join'
      }));
      
      // Create offer as the provider
      if (pc.signalingState !== 'closed') {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(JSON.stringify({
            user_id: userId,
            action: 'offer',
            target_user: 'patient',
            sdp: offer
          }));
        } catch (error) {
          console.error('Error creating offer:', error);
        }
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      if (pc.signalingState !== 'closed') {
        pc.close();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [appointmentId, userId]);

  const endCall = () => {
    if (socket) {
      socket.send(JSON.stringify({
        user_id: userId,
        action: 'leave'
      }));
    }
    if (peerConnection) {
      peerConnection.close();
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Video Consultation</h1>
      <div className="flex gap-4 mb-4">
        <div className="border rounded-lg overflow-hidden">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            className="w-64 h-48 object-cover"
          />
          <p className="text-center p-2 bg-gray-100">You</p>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            className="w-64 h-48 object-cover"
          />
          <p className="text-center p-2 bg-gray-100">Patient</p>
        </div>
      </div>
      <Button 
        variant="destructive" 
        onClick={endCall}
        className="mt-4"
      >
        End Call
      </Button>
    </div>
  )
}