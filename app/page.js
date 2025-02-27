"use client"; // This must be the first line

import { useState } from "react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from 'next/link';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(-1);

  const scrollToSection = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      const offset = 80; // Account for fixed header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const faqItems = [
    {
      question: "How is this app different from MyFitnessPal?",
      answer: "Unlike MyFitnessPal, which focuses on calorie counting, our app is designed to give you personalized insights based on your habits. We prioritize efficiency over manual input, offering a seamless experience that helps you stay on track without tedious logging."
    },
    {
      question: "Is this app beginner-friendly?",
      answer: "Absolutely! We built this app to be simple, intuitive, and frustration-free. Whether you&apos;re just starting your health journey or you&apos;re a seasoned pro, our features adapt to your level—no overwhelming dashboards or confusing settings."
    },
    {
      question: "Do I need a subscription to use the app?",
      answer: "Yes, CalFuel requires a subscription of 3,99€ per month to access all features. We believe in providing premium value at an affordable price, with no hidden costs or complicated tiers. You can cancel anytime, no questions asked."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-gray-900">🌱 CalFuel</span>
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                FAQ
              </button>
              <Link 
                href="/auth?signup=true"
                className="bg-[#4ade80] text-white px-6 py-2 rounded-lg hover:bg-[#22c55e] transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Product Image */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-gray-50 overflow-hidden">
                <img
                  src="https://placehold.co/800x600/f3f4f6/d1d5db?text=Product+Screenshot"
                  alt="CalFuel app interface"
                  className="object-cover object-center w-full h-full"
                />
                {/* Add a subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-900/5 via-gray-900/5 to-transparent"></div>
              </div>
              {/* Add decorative elements */}
              <div className="absolute -z-10 inset-0 bg-[#4ade80]/5 blur-3xl transform rotate-12 translate-y-12"></div>
            </div>

            {/* Hero Content */}
            <div className="text-left lg:max-w-xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
                Track Your Nutrition
                <span className="block text-[#4ade80]">With Precision</span>
              </h1>
              <p className="mt-6 text-xl text-gray-500">
                Your journey, your rules. The nutrition tracker that adapts to your lifestyle. Built by you, for you.
              </p>
              <div className="mt-10">
                <Link
                  href="/auth?signup=true"
                  className="bg-[#4ade80] text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-[#22c55e] transition-colors inline-flex items-center"
                >
                  Start Tracking
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Features You&apos;ll Love</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Simple tools that make tracking your nutrition effortless.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 - Easy Tracking */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-[#4ade80]/5 to-transparent rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-[#4ade80]/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Tracking</h3>
                <p className="text-gray-500 mb-4">Log your meals quickly and efficiently with our intuitive interface.</p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-[#4ade80] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Simple meal logging
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-[#4ade80] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Quick-add favorites
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 2 - Detailed Analytics */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-[#4ade80]/5 to-transparent rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-[#4ade80]/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Detailed Analytics</h3>
                <p className="text-gray-500 mb-4">Get insights into your nutrition with comprehensive analytics and reports.</p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-[#4ade80] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Nutrition insights
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-[#4ade80] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Progress tracking
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3 - Real-time Updates */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-[#4ade80]/5 to-transparent rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-[#4ade80]/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Updates</h3>
                <p className="text-gray-500 mb-4">See your progress update instantly as you log your meals throughout the day.</p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-[#4ade80] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Instant feedback
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-[#4ade80] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Live goal tracking
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-500">No hidden fees. No complicated tiers. Just one perfect plan.</p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
              <div className="p-8 sm:p-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-white">Premium</h3>
                  <span className="inline-flex px-4 py-1 text-sm font-semibold text-[#4ade80] bg-[#4ade80]/10 rounded-full">
                    One and Only
                  </span>
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-white">3,99€</span>
                    <span className="ml-2 text-2xl text-gray-400">/month</span>
                  </div>
                  <p className="mt-2 text-gray-400">Everything you need to reach your nutritional goals</p>
                </div>

                <div className="mt-8 border-t border-gray-800 pt-8">
                  <ul className="space-y-5">
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-base text-gray-300">
                        <span className="font-semibold text-white">Unlimited meal tracking</span>
                        <br />
                        <span className="text-gray-400">Track all your meals with ease</span>
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-base text-gray-300">
                        <span className="font-semibold text-white">Dashboard and Analytics</span>
                        <br />
                        <span className="text-gray-400">Deep insights into your nutrition</span>
                      </p>
                    </li>
                    
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-base text-gray-300">
                        <span className="font-semibold text-white">Priority support</span>
                        <br />
                        <span className="text-gray-400">Get help when you need it</span>
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  <Link
                    href="/auth?signup=true"
                    className="block w-full bg-[#4ade80] text-center px-6 py-4 text-lg font-medium text-white rounded-xl hover:bg-[#22c55e] transition-colors duration-200"
                  >
                    Get Started Now
                  </Link>
                </div>

                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>30-day money-back guarantee</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">Cancel anytime. No questions asked.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <h3 className="text-xl font-semibold text-gray-900">{item.question}</h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 text-[#4ade80] transition-transform duration-200 ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`transition-all duration-200 ease-in-out ${
                    openFaq === index
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0'
                  } overflow-hidden`}
                >
                  <p className="p-6 pt-0 text-gray-500">{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">© 2024 CalFuel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
