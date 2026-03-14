import { SEO } from './lib/seo';
import { buildWebSiteSchema } from './lib/seo';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthGuard } from './components/AuthGuard';
import { RateLimitDashboard } from './components/RateLimitDashboard';

function HomePage() {
  return (
    <>
      <SEO
        title="Home"
        description="A modern, SEO-optimized React application built with Vite and TypeScript"
        openGraph={{
          type: 'website',
          url: 'https://example.com/',
          title: 'My Awesome App',
          description: 'A modern, SEO-optimized React application',
          image: 'https://via.placeholder.com/1200x630?text=My+Awesome+App',
        }}
        jsonLd={buildWebSiteSchema('My Awesome App', 'https://example.com/', {
          description: 'A modern, SEO-optimized React application',
        })}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-slate-900">My Awesome App</Link>
            <div className="flex gap-4">
              <Link to="/rate-limits" className="text-slate-600 hover:text-slate-900 transition">
                Rate Limits
              </Link>
              <Link to="/admin" className="text-slate-600 hover:text-slate-900 transition">
                Admin Dashboard
              </Link>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition">
                Documentation
              </a>
            </div>
          </nav>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-20">
          <section className="text-center mb-20">
            <h2 className="text-5xl font-bold text-slate-900 mb-6">
              React SEO Kit Integrated
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              A production-ready, drop-in SEO toolkit for Vite/React applications. Featuring
              meta tag management, optimized images, and automated sitemap generation.
            </p>

            <div className="inline-flex gap-4">
              <button className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition">
                Get Started
              </button>
              <button className="px-6 py-3 border border-slate-300 text-slate-900 rounded-lg font-medium hover:bg-slate-50 transition">
                Learn More
              </button>
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Meta Tags',
                description:
                  'Unified SEO component with Open Graph, Twitter Cards, and JSON-LD structured data',
              },
              {
                title: 'Image Optimization',
                description:
                  'Strict Image component enforces dimensions and lazy loading for Core Web Vitals',
              },
              {
                title: 'Automated Sitemaps',
                description:
                  'Post-build sitemap generation from your routes configuration',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-lg transition"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </section>

          <section className="mt-20 bg-white rounded-lg border border-slate-200 p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Quick Start</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <span className="text-2xl font-bold text-slate-300 w-8">1</span>
                <div>
                  <p className="font-semibold text-slate-900">Wrap your app with SEOProvider</p>
                  <p className="text-slate-600 text-sm">Done! The kit is already integrated.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="text-2xl font-bold text-slate-300 w-8">2</span>
                <div>
                  <p className="font-semibold text-slate-900">Use SEO component on pages</p>
                  <p className="text-slate-600 text-sm">Inject meta tags, Open Graph, and JSON-LD</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="text-2xl font-bold text-slate-300 w-8">3</span>
                <div>
                  <p className="font-semibold text-slate-900">Run npm run build</p>
                  <p className="text-slate-600 text-sm">Sitemap and robots.txt are generated automatically</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-200 bg-white mt-20">
          <div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-600">
            <p>React SEO Kit • Production-ready SEO for Vite/React</p>
          </div>
        </footer>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/rate-limits"
          element={
            <AuthGuard requiredRole="authenticated">
              <RateLimitDashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <AuthGuard requiredRole="admin">
              <AdminDashboard />
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
