
import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Icons defined as small reusable components to avoid external SVG library dependencies
 * while maintaining a professional look.
 */
const CheckIcon = () => (
  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const LogoIcon = () => (
  <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 18H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Welcome = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation - Notch Style */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 pb-6">
        <div className="bg-white rounded-full shadow-xl border border-gray-200 px-8 py-4 flex items-center gap-12 max-w-fit">
          <div className="flex items-center gap-2">
            <LogoIcon />
            <span className="text-lg font-bold tracking-tight text-slate-800 hidden sm:inline">Invoice Reminder</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('what-we-solve')}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              What We Solve
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              How It Works
            </button>
          </div>

          <button 
            onClick={handleSignUp}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2 rounded-full transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 py-12 lg:py-24 bg-gradient-to-b from-white to-gray-50 pt-32">
        <div className="max-w-3xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
              Get paid on time, <br className="hidden sm:block" />
              <span className="text-blue-600">without the awkward follow-ups.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Invoice Reminder helps freelancers and small businesses automate their accounts receivable. 
              We send the polite reminders, so you can stay focused on your work.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 pt-4">
            <button
              onClick={handleSignUp}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1 active:scale-95"
            >
              Create your first invoice
            </button>
            
            <p className="text-sm text-slate-500">
              Free to start. No credit card required.
            </p>
          </div>

          {/* Value Propositions / Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left">
            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-slate-800">Create an invoice</h3>
              <p className="text-sm text-slate-600">Quickly generate professional invoices for your clients.</p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-slate-800">Auto reminders</h3>
              <p className="text-sm text-slate-600">We automatically send polite, scheduled follow-ups if they're late.</p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-slate-800">You get paid</h3>
              <p className="text-sm text-slate-600">Payments land in your account faster. No more chasing clients manually.</p>
            </div>
          </div>
        </div>
      </main>

      {/* What We Solve Section */}
      <section id="what-we-solve" className="py-16 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-12 text-center">
            What We Solve
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">The Real Problem</h3>
              <p className="text-slate-700 mb-4">
                Chasing unpaid invoices is awkward, time-consuming, and easy to avoid — until it costs you money.
              </p>
              <p className="text-slate-700 mb-6">
                Freelancers and small businesses deliver great work, send an invoice… and then wait. Following up feels uncomfortable. Forgetting to follow up means you don't get paid on time.
              </p>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-blue-600 font-semibold flex-shrink-0">•</span>
                  <p className="text-slate-700">Most people either send reminders manually (and late)</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-blue-600 font-semibold flex-shrink-0">•</span>
                  <p className="text-slate-700">Or avoid sending reminders at all</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-blue-600 font-semibold flex-shrink-0">•</span>
                  <p className="text-slate-700">Or use bloated accounting software just for one simple need</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Our Focus</h3>
              <p className="text-slate-700 mb-4">
                <strong>The Problem Isn't Invoicing. It's Following Up.</strong>
              </p>
              <p className="text-slate-700 mb-6">
                Creating an invoice is easy. Getting paid is the hard part. The real problems are:
              </p>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-blue-600 font-semibold flex-shrink-0">→</span>
                  <p className="text-slate-700">Remembering when to send a reminder</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-blue-600 font-semibold flex-shrink-0">→</span>
                  <p className="text-slate-700">Writing a message that's polite but effective</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-blue-600 font-semibold flex-shrink-0">→</span>
                  <p className="text-slate-700">Avoiding damage to client relationships</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-blue-600 font-semibold flex-shrink-0">→</span>
                  <p className="text-slate-700">Spending mental energy on something that should be automatic</p>
                </div>
              </div>
            </div>
          </div>

          {/* Why Invoice Reminder Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12">
            <h3 className="text-2xl font-semibold text-slate-900 mb-6 text-center">
              What Invoice Reminder Does Instead
            </h3>
            <p className="text-slate-700 text-center mb-8 text-lg">
              We focus on one job only: <strong>Automatically send polite, timely invoice reminders so you don't have to chase clients.</strong>
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="border-l-4 border-blue-600 pl-6">
                <h4 className="font-semibold text-slate-900 mb-2">What We Include</h4>
                <ul className="space-y-2 text-slate-700">
                  <li>✓ Automatic scheduled reminders</li>
                  <li>✓ Professional, polite messaging</li>
                  <li>✓ Simple, distraction-free interface</li>
                  <li>✓ Customizable reminder schedules</li>
                </ul>
              </div>

              <div className="border-l-4 border-slate-300 pl-6">
                <h4 className="font-semibold text-slate-900 mb-2">What We Don't</h4>
                <ul className="space-y-2 text-slate-600">
                  <li>✗ Complex accounting features</li>
                  <li>✗ Payment processing setup</li>
                  <li>✗ Unnecessary dashboards and workflows</li>
                  <li>✗ Financial reporting bloat</li>
                </ul>
              </div>
            </div>

            <p className="text-center text-slate-600 italic">
              Simple tools should solve real problems without getting in the way.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-semibold text-slate-900 mb-12 text-center">
            How This Helps You
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h4 className="font-semibold text-slate-900 mb-2">⚡ Faster Payments</h4>
              <p className="text-slate-700">Get paid faster without awkward emails. Your clients receive calm, professional reminders on your behalf.</p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h4 className="font-semibold text-slate-900 mb-2">✓ Complete Coverage</h4>
              <p className="text-slate-700">Nothing slips through the cracks. Every unpaid invoice gets the right amount of follow-up at the right time.</p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h4 className="font-semibold text-slate-900 mb-2">🧠 Peace of Mind</h4>
              <p className="text-slate-700">Spend less time thinking about unpaid invoices. The tool works quietly in the background, doing the follow-up for you.</p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h4 className="font-semibold text-slate-900 mb-2">🤝 Better Relationships</h4>
              <p className="text-slate-700">Professional, respectful reminders maintain your client relationships while ensuring you get paid on time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is For Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-semibold text-slate-900 mb-12 text-center">
            Who This Is For
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h4 className="font-semibold text-slate-900 mb-6 text-lg text-green-600">Perfect For</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckIcon />
                  <span className="text-slate-700">Freelancers</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckIcon />
                  <span className="text-slate-700">Consultants</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckIcon />
                  <span className="text-slate-700">Solo founders</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckIcon />
                  <span className="text-slate-700">Small agencies</span>
                </li>
              </ul>
              <p className="mt-6 text-slate-600 text-sm">
                If you send invoices and hate chasing them, this is for you.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-6 text-lg text-slate-400">Not For</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className="text-slate-300">✗</span>
                  <span className="text-slate-600">Accounting platforms</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-slate-300">✗</span>
                  <span className="text-slate-600">Payment processors</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-slate-300">✗</span>
                  <span className="text-slate-600">ERP or finance suites</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-slate-300">✗</span>
                  <span className="text-slate-600">Complex reporting tools</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Checklist Reassurance Section */}
      <section className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-xl mx-auto px-4">
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <CheckIcon />
              <span className="text-slate-700">Simple, distraction-free interface</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckIcon />
              <span className="text-slate-700">Customizable reminder schedules</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckIcon />
              <span className="text-slate-700">Professional tone guaranteed</span>
            </li>
          </ul>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gradient-to-b from-white to-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-16 text-center">
            How It Works
          </h2>

          {/* 4-Step Process */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Create an Invoice</h3>
              </div>
              <div className="ml-16">
                <p className="text-slate-700 mb-4">
                  Add your client, invoice amount, and due date.
                </p>
                <ul className="space-y-2 text-slate-600 text-sm">
                  <li>✓ No accounting setup</li>
                  <li>✓ No payment configuration</li>
                  <li>✓ Just the basics</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600">
                    <span className="text-white font-bold text-lg">2</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Turn On Automatic Reminders</h3>
              </div>
              <div className="ml-16">
                <p className="text-slate-700 mb-4">
                  Choose when reminders should be sent if the invoice isn't paid.
                </p>
                <p className="text-slate-600 text-sm font-medium mb-2">We handle:</p>
                <ul className="space-y-2 text-slate-600 text-sm">
                  <li>• Timing</li>
                  <li>• Polite wording</li>
                  <li>• Consistent follow-ups</li>
                </ul>
                <p className="text-slate-600 text-sm mt-3">You don't need to remember anything.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600">
                    <span className="text-white font-bold text-lg">3</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">We Send Polite Email Reminders</h3>
              </div>
              <div className="ml-16">
                <p className="text-slate-700 mb-4">
                  If the invoice remains unpaid, we automatically send calm, professional reminder emails to your client.
                </p>
                <ul className="space-y-2 text-slate-600 text-sm">
                  <li>✓ No awkward messages</li>
                  <li>✓ No manual chasing</li>
                </ul>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600">
                    <span className="text-white font-bold text-lg">4</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Mark as Paid When You're Done</h3>
              </div>
              <div className="ml-16">
                <p className="text-slate-700 mb-4">
                  Once the invoice is paid, mark it as paid and reminders stop immediately.
                </p>
                <p className="text-slate-600 text-sm">Nothing more to manage.</p>
              </div>
            </div>
          </div>

          {/* That's It Section */}
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-8 mb-16">
            <h3 className="text-2xl font-semibold text-slate-900 mb-6 text-center">
              That's It
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-slate-700 font-medium">No dashboards full of data</p>
              </div>
              <div>
                <p className="text-slate-700 font-medium">No complex workflows</p>
              </div>
              <div>
                <p className="text-slate-700 font-medium">No unnecessary features</p>
              </div>
            </div>
            <p className="text-center text-slate-600 mt-8 text-lg">
              Just automatic invoice reminders that work quietly in the background.
            </p>
          </div>

          {/* Built for Real Workflows */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12">
            <h3 className="text-2xl font-semibold text-slate-900 mb-6 text-center">
              Built for Real Workflows
            </h3>
            <p className="text-slate-700 text-center mb-8">
              Invoice Reminder fits alongside whatever tools you already use for:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-slate-900">Payments</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-slate-900">Accounting</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-slate-900">Bookkeeping</p>
              </div>
            </div>

            <p className="text-center text-slate-600 italic">
              We don't replace them — we remove one annoying task.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100 text-center">
        <p className="text-sm text-slate-400">
          &copy; {new Date().getFullYear()} Invoice Reminder. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Welcome;
