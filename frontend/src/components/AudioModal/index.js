import { Button } from "@material-ui/core";
import React, { useRef, useEffect, useState } from "react";

const LS_NAME = 'audioMessageRate';

const AudioModal = ({ url }) => {
    const audioRef = useRef(null);
    const [audioRate, setAudioRate] = useState(parseFloat(localStorage.getItem(LS_NAME) || "1"));
    const [showButtonRate, setShowButtonRate] = useState(false);
    const [audioUrl, setAudioUrl] = useState('');
    const [isAudioLoaded, setIsAudioLoaded] = useState(false);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    useEffect(() => {
        let sourceUrl = url;
        // Sempre usar MP3 para iOS
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
            const audio = audioRef.current;

            const handlePlaying = () => setShowButtonRate(true);
            const handlePauseEnd = () => setShowButtonRate(false);
            const handleCanPlay = () => setIsAudioLoaded(true);
            
            // Configurações específicas para iOS
            if (isIOS) {
                audio.preload = "auto";
                // Força o carregamento inicial
                audio.load();
                
                // Configura playsinline novamente via JavaScript
                audio.playsInline = true;
                audio.setAttribute('playsinline', 'true');
                audio.setAttribute('webkit-playsinline', 'true');
            }

            audio.addEventListener('playing', handlePlaying);
            audio.addEventListener('pause', handlePauseEnd);
            audio.addEventListener('ended', handlePauseEnd);
            audio.addEventListener('canplay', handleCanPlay);
            
            // Tratamento específico para iOS
            if (isIOS) {
                audio.addEventListener('loadedmetadata', () => {
                    audio.currentTime = 0;
                });
            }

            return () => {
                audio.removeEventListener('playing', handlePlaying);
                audio.removeEventListener('pause', handlePauseEnd);
                audio.removeEventListener('ended', handlePauseEnd);
                audio.removeEventListener('canplay', handleCanPlay);
                if (isIOS) {
                    audio.removeEventListener('loadedmetadata', () => {});
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
                    preload={isIOS ? "auto" : "metadata"}
                    playsInline
                    webkit-playsinline="true"
                    x-webkit-airplay="allow"
                    controlsList="nodownload"
                    style={{ display: isAudioLoaded ? 'block' : 'none' }}
                >
                    <source 
                        src={audioUrl} 
                        type={isIOS || audioUrl.endsWith('.mp3') ? "audio/mpeg" : "audio/ogg"} 
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