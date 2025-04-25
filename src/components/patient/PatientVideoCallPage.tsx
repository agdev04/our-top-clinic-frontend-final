import React, { useState, useEffect, useRef } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PatientVideoCallPage: React.FC = () => {
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
        })
        .catch((err) => {
          console.error('Failed to get local stream', err);
          alert('Failed to access camera and microphone. Please check permissions.');
        });
    });

    peer.on('call', (call) => {
      console.log('Incoming call from:', call.peer);
      if (!myStream) {
        console.error('Cannot answer call without local stream.');
        alert('Local video stream is not ready. Cannot answer call.');
        return;
      }
      // Answer the call with the local stream
      call.answer(myStream);
      currentCall.current = call; // Store the call object
      setCallInProgress(true);
      setRemotePeerIdInput(call.peer); // Store the caller's ID

      call.on('stream', (remoteStream) => {
        console.log('Received remote stream');
        setRemoteStream(remoteStream);
        if (remoteUserVideoRef.current) {
          remoteUserVideoRef.current.srcObject = remoteStream;
        }
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

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      alert(`PeerJS error: ${err.message}. Please refresh the page.`);
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
  }, [myStream]); // Re-run effect if myStream changes

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
      alert('Please enter the Provider\'s Peer ID.');
      return;
    }

    console.log(`Calling peer: ${remotePeerId}`);
    const call = peerInstance.current.call(remotePeerId, myStream);
    currentCall.current = call; // Store the call object
    setCallInProgress(true);

    call.on('stream', (remoteStream) => {
      console.log('Received remote stream from initiated call');
      setRemoteStream(remoteStream);
      if (remoteUserVideoRef.current) {
        remoteUserVideoRef.current.srcObject = remoteStream;
      }
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
    // Keep remotePeerIdInput as the patient might need to reconnect
  };

  return (
    <div className="p-4 flex flex-col items-center space-y-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Patient Video Call</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Your Peer ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{peerId || 'Initializing...'}</span></p>
          <p className="text-sm text-gray-600">Share this ID with the provider if needed, or use their ID to call.</p>

          {!callInProgress ? (
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Enter Provider's Peer ID"
                value={remotePeerIdInput}
                onChange={(e) => setRemotePeerIdInput(e.target.value)}
                className="flex-grow"
              />
              <Button onClick={() => callPeer(remotePeerIdInput)} disabled={!peerId || !myStream}>
                Call Provider
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
              <h3 className="text-center font-semibold mb-2">Provider's Video</h3>
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

export default PatientVideoCallPage;