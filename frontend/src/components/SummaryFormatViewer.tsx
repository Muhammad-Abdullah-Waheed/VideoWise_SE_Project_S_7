import React from 'react';
import { FileText, List, Clock, BookOpen, Star } from 'lucide-react';

interface SummaryFormatViewerProps {
  summary: string;
  format: 'paragraph' | 'bullet' | 'timeline' | 'chapters' | 'highlights';
  transcript?: string;
  visualCaptions?: Array<{ frame?: number; caption: string }>;
}

const SummaryFormatViewer: React.FC<SummaryFormatViewerProps> = ({
  summary,
  format,
  transcript,
  visualCaptions
}) => {
  // Parse summary into different formats
  const parseBulletPoints = (text: string) => {
    // Split by sentences and create bullets
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.map(s => s.trim());
  };

  const parseTimeline = (text: string) => {
    // Try to extract time-based information or create timeline
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.map((s, idx) => ({
      time: idx * 10, // Approximate time (would be better with actual timestamps)
      text: s.trim()
    }));
  };

  const parseChapters = (text: string) => {
    // Split into logical sections (by paragraphs)
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    return paragraphs.map((p, idx) => ({
      title: `Chapter ${idx + 1}`,
      content: p.trim()
    }));
  };

  const parseHighlights = (text: string) => {
    // Extract key sentences (longer sentences are usually more important)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sorted = sentences.sort((a, b) => b.length - a.length);
    return sorted.slice(0, Math.min(5, sorted.length)); // Top 5 highlights
  };

  const renderFormat = () => {
    switch (format) {
      case 'bullet':
        const bullets = parseBulletPoints(summary);
        return (
          <div className="space-y-2">
            {bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <List className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">{bullet}</p>
              </div>
            ))}
          </div>
        );

      case 'timeline':
        const timeline = parseTimeline(summary);
        return (
          <div className="space-y-4">
            {timeline.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary-600" />
                    <span className="text-sm font-medium text-primary-600">
                      {Math.floor(item.time / 60)}:{(item.time % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
                <div className="flex-1 border-l-2 border-primary-200 pl-4">
                  <p className="text-gray-700">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'chapters':
        const chapters = parseChapters(summary);
        return (
          <div className="space-y-6">
            {chapters.map((chapter, idx) => (
              <div key={idx} className="border-l-4 border-primary-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-primary-600" />
                  <span>{chapter.title}</span>
                </h3>
                <p className="text-gray-700 leading-relaxed">{chapter.content}</p>
              </div>
            ))}
          </div>
        );

      case 'highlights':
        const highlights = parseHighlights(summary);
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Star className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Key Highlights</h3>
            </div>
            {highlights.map((highlight, idx) => (
              <div key={idx} className="bg-primary-50 border-l-4 border-primary-600 p-4 rounded-r-lg">
                <p className="text-gray-700">{highlight}</p>
              </div>
            ))}
          </div>
        );

      default: // paragraph
        return (
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{summary}</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="h-5 w-5 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {format === 'bullet' && 'Bullet Points Summary'}
            {format === 'timeline' && 'Timeline Summary'}
            {format === 'chapters' && 'Chapter Summary'}
            {format === 'highlights' && 'Key Highlights'}
            {format === 'paragraph' && 'Summary'}
          </h2>
        </div>
        {renderFormat()}
      </div>

      {transcript && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Transcript</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{transcript}</p>
          </div>
        </div>
      )}

      {visualCaptions && visualCaptions.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Visual Captions</h2>
          <div className="space-y-2">
            {visualCaptions.map((caption, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Frame {caption.frame || idx + 1}</p>
                <p className="text-gray-900">{caption.caption}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryFormatViewer;



