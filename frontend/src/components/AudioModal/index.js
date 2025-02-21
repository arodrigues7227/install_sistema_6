import { Button } from "@material-ui/core";
import React, { useRef, useEffect, useState } from "react";

const LS_NAME = 'audioMessageRate';

const AudioModal = ({url}) => {
    const audioRef = useRef(null);
    const [audioRate, setAudioRate] = useState(parseFloat(localStorage.getItem(LS_NAME) || "1"));
    const [showButtonRate, setShowButtonRate] = useState(false);
    const [audioUrl, setAudioUrl] = useState('');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    useEffect(() => {
        // Determina a URL correta com base no sistema operacional
        let sourceUrl = url;
        if (isIOS && sourceUrl.endsWith('.ogg')) {
            sourceUrl = sourceUrl.replace(".ogg", ".mp3");
        }
        setAudioUrl(sourceUrl);
    }, [url, isIOS]);
  
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = audioRate;
            localStorage.setItem(LS_NAME, audioRate);
        }
    }, [audioRate]);
  
    useEffect(() => {
        if (audioRef.current) {
            const handlePlaying = () => setShowButtonRate(true);
            const handlePauseEnd = () => setShowButtonRate(false);
            
            audioRef.current.addEventListener('playing', handlePlaying);
            audioRef.current.addEventListener('pause', handlePauseEnd);
            audioRef.current.addEventListener('ended', handlePauseEnd);
            
            // Para iOS, precisamos carregar o áudio explicitamente
            if (isIOS) {
                audioRef.current.load();
            }
            
            return () => {
                if (audioRef.current) {
                    audioRef.current.removeEventListener('playing', handlePlaying);
                    audioRef.current.removeEventListener('pause', handlePauseEnd);
                    audioRef.current.removeEventListener('ended', handlePauseEnd);
                }
            };
        }
    }, [isIOS, audioUrl]);
  
    const toggleRate = () => {
        let newRate = null;
  
        switch (audioRate) {
            case 0.5:
                newRate = 1;
                break;
            case 1:
                newRate = 1.5;
                break;
            case 1.5:
                newRate = 2;
                break;
            case 2:
                newRate = 0.5;
                break;
            default:
                newRate = 1;
                break;
        }
  
        setAudioRate(newRate);
    };
  
    return (
        <>
            {audioUrl && (
                <audio
                    ref={audioRef}
                    controls
                    preload="metadata"
                    playsInline
                    controlsList="nodownload"
                >
                    <source 
                        src={audioUrl} 
                        type={isIOS || audioUrl.endsWith('.mp3') ? "audio/mp3" : "audio/ogg"} 
                    />
                    Seu navegador não suporta o elemento de áudio.
                </audio>
            )}
            {showButtonRate && (
                <Button
                    style={{ marginLeft: "5px", marginTop: "-45px" }}
                    onClick={toggleRate}
                >
                    {audioRate}x
                </Button>
            )}
        </>
    );
}

export default AudioModal;