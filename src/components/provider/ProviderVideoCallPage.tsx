import React, { useState, useEffect, useRef } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProviderVideoCallPage: React.FC = () => {
  const [peerId, setPeerId] = useState<string>('');
  const [remotePeerIdInput, setRemotePeerIdInput] = useState<string>('');
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callInProgress, setCallInProgress] = useState<boolean>(false);

  const peerInstance = useRef<Peer | null>(null);
  const currentCall = useRef<MediaConnection | null>(null);
  const currentUserVideoRef = useRef<HTMLVideoElement>(null);
  const remoteUserVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Initialize PeerJS
    const peer = new Peer();
    peerInstance.current = peer;

    peer.on('open', (id) => {
      console.log('My PeerJS ID is:', id);
      setPeerId(id);
      // Get user media (camera and microphone)
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setMyStream(stream);
          if (currentUserVideoRef.current) {
            currentUserVideoRef.current.srcObject = stream;
          }

          // Set up the incoming call handler ONLY after the stream is ready
          peer.on('call', (call) => {
            console.log('Incoming call from:', call.peer);
            // No need to check for myStream here as this runs after it's set
            // Answer the call with the local stream
            call.answer(stream); // Use the obtained stream directly
            currentCall.current = call; // Store the call object
            setCallInProgress(true);

            call.on('stream', (remoteStream) => {
              console.log('Received remote stream');
              setRemoteStream(remoteStream);
              // Removed direct assignment from here
            });

            call.on('close', () => {
              console.log('Call closed by remote peer');
              endCall();
            });

            call.on('error', (err) => {
              console.error('PeerJS call error:', err);
              endCall();
            });
          });
        })
        .catch((err) => {
          console.error('Failed to get local stream', err);
          alert('Failed to access camera and microphone. Please check permissions.');
        });
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      alert(`PeerJS error: ${err.message}. Please refresh the page.`);
      // Handle specific errors like 'disconnected', 'network', etc.
    });

    // Cleanup on component unmount
    return () => {
      console.log('Cleaning up PeerJS connection');
      if (currentCall.current) {
        currentCall.current.close();
        currentCall.current = null;
      }
      if (peerInstance.current) {
        peerInstance.current.destroy();
        peerInstance.current = null;
      }
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Run only once on mount

  const callPeer = (remotePeerId: string) => {
    if (!peerInstance.current) {
      alert('Peer connection not established yet.');
      return;
    }
    if (!myStream) {
      alert('Local video stream not ready. Cannot make call.');
      return;
    }
    if (!remotePeerId) {
      alert('Please enter the Patient\'s Peer ID.');
      return;
    }

    console.log(`Calling peer: ${remotePeerId}`);
    const call = peerInstance.current.call(remotePeerId, myStream);
    currentCall.current = call; // Store the call object
    setCallInProgress(true);

    call.on('stream', (remoteStream) => {
      console.log('Received remote stream from initiated call');
      setRemoteStream(remoteStream);
      // Removed direct assignment from here
    });

    call.on('close', () => {
      console.log('Call closed');
      endCall();
    });

    call.on('error', (err) => {
      console.error('PeerJS call error:', err);
      alert(`Call failed: ${err.message}`);
      endCall();
    });
  };

  const endCall = () => {
    console.log('Ending call');
    if (currentCall.current) {
      currentCall.current.close();
      currentCall.current = null;
    }
    setRemoteStream(null);
    setCallInProgress(false);
    // Optionally clear the remote peer ID input
    // setRemotePeerIdInput('');
  };

  // New useEffect to handle remote stream attachment
  useEffect(() => {
    if (remoteStream && remoteUserVideoRef.current) {
      remoteUserVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="p-4 flex flex-col items-center space-y-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Provider Video Call</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Your Peer ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{peerId || 'Initializing...'}</span></p>
          <p className="text-sm text-gray-600">Share this ID with the patient.</p>

          {!callInProgress ? (
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Enter Patient's Peer ID"
                value={remotePeerIdInput}
                onChange={(e) => setRemotePeerIdInput(e.target.value)}
                className="flex-grow"
              />
              <Button onClick={() => callPeer(remotePeerIdInput)} disabled={!peerId || !myStream}>
                Call Patient
              </Button>
            </div>
          ) : (
            <Button onClick={endCall} variant="destructive">
              End Call
            </Button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-2">
              <h3 className="text-center font-semibold mb-2">Your Video</h3>
              <video ref={currentUserVideoRef} muted autoPlay playsInline className="w-full h-auto bg-black rounded" />
            </div>
            <div className="border rounded p-2">
              <h3 className="text-center font-semibold mb-2">Patient's Video</h3>
              {remoteStream ? (
                <video ref={remoteUserVideoRef} autoPlay playsInline className="w-full h-auto bg-black rounded" />
              ) : (
                <div className="w-full aspect-video bg-gray-200 flex items-center justify-center rounded">
                  <p className="text-gray-500">{callInProgress ? 'Connecting...' : 'Waiting for call...'}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderVideoCallPage;