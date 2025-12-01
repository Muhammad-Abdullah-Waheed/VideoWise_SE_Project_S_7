import { Link } from 'react-router-dom';
import { Video, Zap, User, BarChart3, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-primary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              AI-Powered Video
              <br />
              <span className="text-primary-600">Summarization</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform long videos into concise, personalized summaries using multi-modal AI analysis.
              Understand audio, visual content, and on-screen text in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary inline-flex items-center space-x-2">
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn-primary inline-flex items-center space-x-2">
                    <span>Get Started</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link to="/login" className="btn-secondary">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <Video className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Multi-Modal Analysis</h3>
              <p className="text-gray-600">
                Analyzes audio transcription, visual content, and on-screen text for comprehensive understanding.
              </p>
            </div>
            <div className="card text-center">
              <User className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Profile-Aware Summaries</h3>
              <p className="text-gray-600">
                Personalized summaries tailored to your expertise, preferences, and role.
              </p>
            </div>
            <div className="card text-center">
              <Zap className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Fast Processing</h3>
              <p className="text-gray-600">
                Get summaries in minutes with real-time progress tracking and status updates.
              </p>
            </div>
            <div className="card text-center">
              <BarChart3 className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Custom Length Control</h3>
              <p className="text-gray-600">
                Choose your preferred summary length - from quick 100-word overviews to detailed 500+ word summaries.
              </p>
            </div>
            <div className="card text-center">
              <Video className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Multiple Styles</h3>
              <p className="text-gray-600">
                Professional, commercial, educational, casual, or technical - choose the style that fits your needs.
              </p>
            </div>
            <div className="card text-center">
              <Zap className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No-Audio Support</h3>
              <p className="text-gray-600">
                Works perfectly even with silent videos using advanced visual analysis and OCR.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of users who are saving time with AI-powered video summaries.
          </p>
          {!isAuthenticated && (
            <Link to="/signup" className="btn-primary bg-white text-primary-600 hover:bg-gray-100 inline-block">
              Create Free Account
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;

