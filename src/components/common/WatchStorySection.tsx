'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, Video, Sparkles } from 'lucide-react';
import { VideoItem } from '@/types';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { initialVideoItems } from '@/data/media';

interface WatchStorySectionProps {
  className?: string;
}

export const WatchStorySection: React.FC<WatchStorySectionProps> = ({ className = '' }) => {
  const [videoList, setVideoList] = useState<VideoItem[]>(initialVideoItems);
  const [selectedVideoModal, setSelectedVideoModal] = useState<VideoItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/media')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data && Array.isArray(json.data.videos) && json.data.videos.length > 0) {
          setVideoList(json.data.videos);
        }
      })
      .catch((err) => console.log('Using default story videos:', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className={`py-16 md:py-24 bg-white border-y border-stone-200/80 ${className}`}>
      <Container>
        <SectionHeading
          eyebrow="Visual Documentary"
          title="Watch Our Story in Action"
          subtitle="Watch co-founders Saurabh and Jayesh demonstrate the farmgate banana harvesting, spice formulation, small-batch frying, and store launches."
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {videoList.map((vid) => (
            <motion.div
              key={vid.id}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedVideoModal(vid)}
              className="bg-[#FAFAF8] rounded-3xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-2xl transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail Container */}
                <div className="relative h-56 w-full overflow-hidden bg-stone-900">
                  <Image
                    src={vid.thumbnail}
                    alt={vid.title}
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-stone-950/25 group-hover:bg-stone-950/40 transition-colors flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-[#9B111E] text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-white ml-1" />
                    </div>
                  </div>

                  {/* Top-Left Category Tag Badge (Yellow pill as shown in screenshot) */}
                  <span className="absolute top-3 left-3 px-3 py-1 bg-amber-400 text-stone-950 text-[10px] sm:text-[11px] font-black rounded-full uppercase tracking-wider shadow-md">
                    {vid.category || 'Story Highlight'}
                  </span>

                  {/* Bottom-Right Duration Tag */}
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-stone-950/85 text-white text-[11px] font-extrabold rounded-md shadow-xs">
                    {vid.duration || '02:30'}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 space-y-2">
                  <h4 className="text-base sm:text-lg font-extrabold text-stone-900 group-hover:text-[#9B111E] transition-colors leading-snug">
                    {vid.title}
                  </h4>
                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                    {vid.description}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 pb-5 pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1.5 text-[#9B111E]">
                  <Video className="w-4 h-4" />
                  <span>Watch Video</span>
                </span>
                <span className="text-stone-500 font-medium truncate max-w-[180px]">
                  {vid.speaker || 'Aapla Jalgaonwala'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>

      {/* Video Modal Player */}
      <AnimatePresence>
        {selectedVideoModal && (
          <VideoPlayerModal
            video={selectedVideoModal}
            onClose={() => setSelectedVideoModal(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

interface VideoPlayerModalProps {
  video: VideoItem;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl(video.videoUrl);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white rounded-3xl overflow-hidden max-w-5xl w-full shadow-2xl border border-stone-200/90 relative flex flex-col md:flex-row my-auto max-h-[92vh] md:max-h-[85vh]"
      >
        {/* Mobile Header Bar with Close Option */}
        <div className="flex md:hidden items-center justify-between p-3.5 bg-stone-900 text-white shrink-0 border-b border-stone-800">
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="px-2.5 py-0.5 bg-amber-400 text-stone-950 text-[10px] font-black rounded-full uppercase tracking-wider shrink-0">
              {video.category || 'Video'}
            </span>
            <h3 className="text-xs font-bold text-white truncate">{video.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LEFT COLUMN: Video Player (PC Left / Mobile Middle) */}
        <div className="w-full md:w-[60%] lg:w-[65%] bg-black relative aspect-video md:aspect-auto flex items-center justify-center shrink-0">
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full min-h-[220px] sm:min-h-[300px] md:min-h-[420px] border-0"
          />
        </div>

        {/* RIGHT COLUMN: Content & Details (PC Right / Mobile Bottom) */}
        <div className="w-full md:w-[40%] lg:w-[35%] p-5 sm:p-6 bg-white flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-3">
            {/* Desktop Close Button & Category Header */}
            <div className="hidden md:flex items-center justify-between gap-2">
              <span className="px-3 py-1 bg-amber-100 text-[#9B111E] text-xs font-extrabold rounded-full uppercase tracking-wider">
                {video.category || 'Documentary'}
              </span>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Title */}
            <h3 className="text-base sm:text-lg md:text-xl font-black text-stone-900 leading-snug">
              {video.title}
            </h3>

            {/* Speaker & Duration Meta */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-stone-500 font-bold border-y border-stone-100 py-2.5">
              <span className="flex items-center gap-1.5 text-[#9B111E]">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{video.speaker || 'Aapla Jalgaonwala'}</span>
              </span>
              <span>•</span>
              <span className="text-stone-600">⏱️ {video.duration || 'Full Duration'}</span>
            </div>

            {/* Description with Short / Expandable logic */}
            <div>
              <p
                className={`text-xs sm:text-sm text-stone-600 leading-relaxed font-medium transition-all ${
                  isExpanded ? '' : 'line-clamp-3 md:line-clamp-8'
                }`}
              >
                {video.description}
              </p>

              {video.description && video.description.length > 80 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs font-bold text-[#9B111E] hover:underline cursor-pointer mt-2 inline-flex items-center gap-1"
                >
                  <span>{isExpanded ? 'Show less' : 'Read full description...'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Mobile Close & Footer Button */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-stone-400 font-medium">
              Authentic Jalgaon Documentary
            </span>
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer md:hidden flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Window</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
