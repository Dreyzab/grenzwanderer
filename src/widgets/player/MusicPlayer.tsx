import React, { useState, useEffect, useRef } from 'react';

interface MusicPlayerProps {
  trackUrl?: string;
  autoPlay?: boolean;
  volume?: number;
  loop?: boolean;
  showControls?: boolean;
}

/**
 * Виджет для воспроизведения фоновой музыки
 */
export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  trackUrl,
  autoPlay = true,
  volume = 0.5,
  loop = true,
  showControls = false
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [trackName, setTrackName] = useState<string>('');
  
  // Извлекаем название трека из URL
  useEffect(() => {
    if (trackUrl) {
      const parts = trackUrl.split('/');
      const fileName = parts[parts.length - 1];
      const trackName = fileName.split('.')[0].replace(/_/g, ' ');
      setTrackName(trackName);
    } else {
      setTrackName('');
    }
  }, [trackUrl]);
  
  // Инициализация аудио
  useEffect(() => {
    if (!trackUrl) {
      setIsPlaying(false);
      return;
    }
    
    if (audioRef.current) {
      audioRef.current.volume = currentVolume;
      audioRef.current.loop = loop;
      
      if (autoPlay) {
        audioRef.current.play().catch(err => {
          console.error('Ошибка автовоспроизведения аудио:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [trackUrl, autoPlay, currentVolume, loop]);
  
  // Обработчик переключения воспроизведения
  const togglePlay = () => {
    if (!audioRef.current || !trackUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Ошибка воспроизведения аудио:', err);
      });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Обработчик изменения громкости
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setCurrentVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };
  
  if (!showControls && !trackUrl) {
    return null;
  }
  
  return (
    <div className={`music-player ${showControls ? 'with-controls' : 'hidden'}`}>
      {trackUrl && (
        <audio
          ref={audioRef}
          src={trackUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}
      
      {showControls && (
        <div className="music-controls">
          <button 
            onClick={togglePlay}
            className="play-button"
            disabled={!trackUrl}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <div className="track-info">
            {trackName || 'Нет трека'}
          </div>
          
          <div className="volume-control">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={currentVolume}
              onChange={handleVolumeChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}; 