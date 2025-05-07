import React, { useEffect, useRef, useState } from 'react';
import './MusicPlayer.css';

interface MusicPlayerProps {
  trackUrl?: string;
  volume?: number;
  autoPlay?: boolean;
  loop?: boolean;
  fadeIn?: boolean;
  fadeOut?: boolean;
  fadeTime?: number;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  trackUrl,
  volume = 0.5,
  autoPlay = true,
  loop = true,
  fadeIn = true,
  fadeOut = true,
  fadeTime = 1000
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<string | undefined>(trackUrl);
  
  // Инициализация аудио
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = 0;
    
    // Подписываемся на события аудио
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    
    // Подчищаем слушатели при размонтировании
    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', () => setIsPlaying(true));
      audio.removeEventListener('pause', () => setIsPlaying(false));
    };
  }, []);
  
  // Обработчик завершения трека
  const handleEnded = () => {
    setIsPlaying(false);
    if (loop && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error('Error playing audio:', e));
    }
  };
  
  // Функция для постепенного изменения громкости
  const fadeTo = (targetVolume: number, duration: number) => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    const startVolume = audio.volume;
    const startTime = performance.now();
    
    const updateVolume = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const newVolume = startVolume + (targetVolume - startVolume) * progress;
      audio.volume = newVolume;
      setCurrentVolume(newVolume);
      
      if (progress < 1) {
        requestAnimationFrame(updateVolume);
      }
    };
    
    requestAnimationFrame(updateVolume);
  };
  
  // Переключение трека
  useEffect(() => {
    if (!audioRef.current || trackUrl === currentTrack) return;
    
    const audio = audioRef.current;
    
    // Постепенно затихаем текущий трек, если он играет
    if (isPlaying && fadeOut) {
      fadeTo(0, fadeTime);
      
      setTimeout(() => {
        audio.pause();
        audio.src = trackUrl || '';
        setCurrentTrack(trackUrl);
        
        if (autoPlay) {
          audio.play().catch(e => console.error('Error playing audio:', e));
          if (fadeIn) {
            fadeTo(volume, fadeTime);
          } else {
            audio.volume = volume;
            setCurrentVolume(volume);
          }
        }
      }, fadeTime);
    } else {
      // Если ничего не играет, просто меняем трек
      audio.src = trackUrl || '';
      setCurrentTrack(trackUrl);
      
      if (autoPlay) {
        audio.play().catch(e => console.error('Error playing audio:', e));
        if (fadeIn) {
          fadeTo(volume, fadeTime);
        } else {
          audio.volume = volume;
          setCurrentVolume(volume);
        }
      }
    }
  }, [trackUrl, autoPlay, fadeIn, fadeOut, fadeTime, volume, isPlaying, currentTrack]);
  
  // Переключение воспроизведения по клику на кнопку
  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      if (fadeOut) {
        fadeTo(0, fadeTime);
        setTimeout(() => {
          audioRef.current?.pause();
        }, fadeTime);
      } else {
        audioRef.current.pause();
      }
    } else {
      audioRef.current.play().catch(e => console.error('Error playing audio:', e));
      if (fadeIn) {
        fadeTo(volume, fadeTime);
      } else {
        audioRef.current.volume = volume;
        setCurrentVolume(volume);
      }
    }
  };
  
  // Можно добавить UI для контроля, или оставить компонент невидимым
  return (
    <div className="music-player">
      {/* Минимальный UI, можно скрыть его полностью */}
      <button 
        className={`music-toggle ${isPlaying ? 'is-playing' : ''}`}
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        <span className="music-icon">{isPlaying ? '♫' : '♪'}</span>
      </button>
    </div>
  );
}; 