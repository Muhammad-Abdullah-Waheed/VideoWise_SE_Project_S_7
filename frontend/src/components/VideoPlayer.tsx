import React, { useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  onSeek?: (seconds: number) => void;
  seekTo?: number;
  timestamps?: Array<{ time: number; text: string }>;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrl, 
  onSeek, 
  seekTo,
  timestamps = []
}) => {
  const playerRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);

  // Seek to timestamp when seekTo changes
  React.useEffect(() => {
    if (seekTo !== undefined && playerRef.current) {
      playerRef.current.seekTo(seekTo, 'seconds');
    }
  }, [seekTo]);

  const handleProgress = (state: any) => {
    if (state && typeof state.played === 'number') {
      setPlayed(state.played);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setPlayed(newTime);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, 'fraction');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimestampClick = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, 'seconds');
      setPlaying(true);
    }
    if (onSeek) {
      onSeek(time);
    }
  };

  return (
    <div className="w-full bg-black rounded-xl overflow-hidden">
      <div className="relative" style={{ paddingTop: '56.25%' }}>
        {React.createElement(ReactPlayer as any, {
          ref: playerRef,
          url: videoUrl,
          playing: playing,
          volume: volume,
          muted: muted,
          onProgress: handleProgress,
          onDuration: setDuration,
          width: "100%",
          height: "100%",
          className: "absolute top-0 left-0",
          controls: false
        })}
      </div>

      {/* Custom Controls */}
      <div className="bg-gray-900 p-4 space-y-3">
        {/* Progress Bar with Timestamps */}
        <div className="relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={played}
            onChange={handleSeekChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          {/* Timestamp Markers */}
          {timestamps.map((ts, idx) => (
            <button
              key={idx}
              onClick={() => handleTimestampClick(ts.time)}
              className="absolute top-0 h-2 w-1 bg-primary-500 hover:bg-primary-400 transition-colors"
              style={{ left: `${(ts.time / duration) * 100}%` }}
              title={ts.text}
            />
          ))}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPlaying(!playing)}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {playing ? (
                <Pause className="h-5 w-5 text-white" />
              ) : (
                <Play className="h-5 w-5 text-white" />
              )}
            </button>
            <button
              onClick={() => setMuted(!muted)}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {muted ? (
                <VolumeX className="h-5 w-5 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <span className="text-white text-sm">
              {formatTime(played * duration)} / {formatTime(duration)}
            </span>
          </div>
          <button
            onClick={() => {
              const player = playerRef.current?.getInternalPlayer();
              if (player && 'requestFullscreen' in player) {
                (player as any).requestFullscreen();
              }
            }}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Maximize className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Timestamps List */}
      {timestamps.length > 0 && (
        <div className="bg-gray-800 p-4 max-h-40 overflow-y-auto">
          <h4 className="text-white text-sm font-medium mb-2">Key Moments</h4>
          <div className="space-y-1">
            {timestamps.map((ts, idx) => (
              <button
                key={idx}
                onClick={() => handleTimestampClick(ts.time)}
                className="w-full text-left text-sm text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded transition-colors"
              >
                <span className="text-primary-400">{formatTime(ts.time)}</span> - {ts.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
