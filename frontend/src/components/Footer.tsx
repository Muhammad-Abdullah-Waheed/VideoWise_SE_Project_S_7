const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">VideoWise</h3>
            <p className="text-sm">
              AI-powered video summarization with multi-modal analysis and personalized summaries.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-sm">
              <li>Multi-modal Analysis</li>
              <li>Profile-aware Summaries</li>
              <li>Custom Length Control</li>
              <li>Fast Processing</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-400">Documentation</a></li>
              <li><a href="#" className="hover:text-primary-400">API Reference</a></li>
              <li><a href="#" className="hover:text-primary-400">Support</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2024 VideoWise. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

