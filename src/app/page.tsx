'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaCalendarAlt, FaMapMarkerAlt, FaComments, FaHandsHelping } from 'react-icons/fa';
import Image from 'next/image';
import MainLayout from '@/layouts/MainLayout';
import { useAuth } from '@/lib/context/AuthContext';
export default function Home() {
  const { user } = useAuth();
  
  // Add a class to handle the breathing effect
  useEffect(() => {
    // Add the Eagles font to the document
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'NFLEagles';
        src: url('/font/NFLEAGLE.TTF') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      .eagles-font {
        font-family: 'NFLEagles', sans-serif;
      }
      
      .breathing-gradient {
        background-size: 400% 400%;
        animation: gradient 15s ease infinite;
      }
      
      @keyframes gradient {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const communityStats = [
    { number: "4", label: "Community Members", icon: FaUsers },
    { number: "1", label: "Monthly Events", icon: FaCalendarAlt },
    { number: "3", label: "Neighborhoods", icon: FaMapMarkerAlt },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen breathing-gradient bg-gradient-to-br from-[#003038] via-[#004C54] to-[#046A38] text-white">
        {/* Hero Section */}
        <section className="px-4 py-16 sm:py-24 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="text-center lg:text-left"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-6 inline-block"
              >
                <div className="relative w-20 h-20 mx-auto lg:mx-0">
                  <Image
                    src="/Logo.png"
                    alt="Philly Social Logo"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
              </motion.div>
              <h1 className="text-5xl eagles-font tracking-tight text-white sm:text-7xl mb-6 drop-shadow-lg">
                Philly <span className="text-[#A5ACAF]">Social</span>
              </h1>
              <p className="text-lg text-white-600 mb-8">
                Join Philadelphia&apos;s premier social platform for connecting with your community
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    href={user ? "/dashboard" : "/signup"} 
                    className="rounded-xl bg-[#A5ACAF] px-8 py-4 text-lg font-semibold text-[#003038] shadow-lg hover:bg-white hover:text-[#004C54] transition-all duration-300 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#004C54] w-full sm:w-auto inline-block"
                  >
                    {user ? "Go to Dashboard" : "Get Started"}
                  </Link>
                </motion.div>
                <motion.div whileHover={{ x: 5 }}>
                  <Link
                    href="/about"
                    className="text-lg font-semibold leading-6 text-[#A5ACAF] hover:text-white transition-colors duration-300 flex items-center gap-2"
                  >
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative"
            >
              <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 shadow-xl">
                <h3 className="text-2xl font-bold mb-4 text-center">Community Pulse</h3>
                <p>These are example messages</p>
                <div className="space-y-4">
                  <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-[#A5ACAF] mb-2">Trending in Philly</p>
                    <p className="font-medium">#PhillyFoodFest happening this weekend at Rittenhouse Square!</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-[#A5ACAF] mb-2">Community Spotlight</p>
                    <p className="font-medium">South Philly neighborhood cleanup initiative gains momentum</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-[#A5ACAF] mb-2">Upcoming Event</p>
                    <p className="font-medium">Tech Meetup at Center City - Join fellow tech enthusiasts!</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Community Stats Section */}
        <motion.section 
          className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <h2 className="text-3xl eagles-font text-center text-white mb-12 drop-shadow-lg">
              Our Thriving Community
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {communityStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div 
                    key={index}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="bg-[#004C54] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Icon size={32} className="text-[#A5ACAF]" />
                    </div>
                    <h3 className="text-4xl font-bold text-white mb-2">{stat.number}</h3>
                    <p className="text-[#A5ACAF]">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Features Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.h2 
            className="text-4xl eagles-font text-center text-white mb-16 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Why Join Philly Social?
          </motion.h2>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div 
              className="group bg-black/30 backdrop-blur-md rounded-xl p-8 flex flex-col items-start transform transition-all duration-300 hover:scale-105 hover:bg-black/40"
              variants={fadeInUp}
            >
              <div className="bg-[#003940] rounded-full p-3 mb-6">
                <FaUsers className="w-6 h-6 text-[#A5ACAF]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Connect with Locals</h3>
              <p className="text-[#A5ACAF] text-lg">Meet and engage with people in your neighborhood who share your interests and passions.</p>
            </motion.div>
            <motion.div 
              className="group bg-black/30 backdrop-blur-md rounded-xl p-8 flex flex-col items-start transform transition-all duration-300 hover:scale-105 hover:bg-black/40"
              variants={fadeInUp}
            >
              <div className="bg-[#003940] rounded-full p-3 mb-6">
                <FaComments className="w-6 h-6 text-[#A5ACAF]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Share Your Philly Story</h3>
              <p className="text-[#A5ACAF] text-lg">Post updates, photos, and experiences unique to Philadelphia that showcase our vibrant city.</p>
            </motion.div>
            <motion.div 
              className="group bg-black/30 backdrop-blur-md rounded-xl p-8 flex flex-col items-start transform transition-all duration-300 hover:scale-105 hover:bg-black/40"
              variants={fadeInUp}
            >
              <div className="bg-[#003940] rounded-full p-3 mb-6">
                <FaCalendarAlt className="w-6 h-6 text-[#A5ACAF]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Discover Local Events</h3>
              <p className="text-[#A5ACAF] text-lg">Stay updated on events happening around the city and never miss out on the action again.</p>
            </motion.div>
          </motion.div>
        </section>

        {/* Community Spotlight Section */}
        <motion.section 
          className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <h2 className="text-3xl eagles-font text-center text-white mb-10 drop-shadow-lg">
              Community Initiatives
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                className="bg-black/30 backdrop-blur-md rounded-xl p-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center mb-4">
                  <div className="bg-[#003940] rounded-full p-3 mr-4">
                    <FaHandsHelping className="w-6 h-6 text-[#A5ACAF]" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Neighborhood Cleanup</h3>
                </div>
                <p className="text-[#A5ACAF]">Join our monthly cleanup initiatives across Philadelphia neighborhoods. Together, we can make our city shine!</p>
                <motion.div 
                  className="mt-4"
                  whileHover={{ x: 5 }}
                >
                  <Link href="/initiatives" className="text-white font-medium flex items-center">
                    Get involved <span className="ml-2">→</span>
                  </Link>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="bg-black/30 backdrop-blur-md rounded-xl p-6"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center mb-4">
                  <div className="bg-[#003940] rounded-full p-3 mr-4">
                    <FaMapMarkerAlt className="w-6 h-6 text-[#A5ACAF]" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Local Business Support</h3>
                </div>
                <p className="text-[#A5ACAF]">Discover and support Philadelphia&apos;s small businesses. Our community highlights local gems every week.</p>
                <motion.div 
                  className="mt-4"
                  whileHover={{ x: 5 }}
                >
                  <Link href="/local-business" className="text-white font-medium flex items-center">
                    Explore local businesses <span className="ml-2">→</span>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.section>
        {/* Call-to-Action Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div 
            className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl eagles-font text-white mb-6 drop-shadow-lg">
              Ready to connect with Philly?
            </h2>
            <p className="text-xl leading-8 text-[#A5ACAF] mb-8">
              Join our community today and start connecting with fellow Philadelphians who share your interests and passions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={user ? "/dashboard" : "/signup"}
                  className="rounded-xl bg-[#A5ACAF] px-8 py-4 text-lg font-semibold text-[#003038] shadow-lg hover:bg-white hover:text-[#004C54] transition-all duration-300 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#004C54]"
                >
                  {user ? "Go to Dashboard" : "Create Account"}
                </Link>
              </motion.div>
              <motion.div whileHover={{ x: 5 }}>
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className="text-lg font-semibold leading-6 text-[#A5ACAF] hover:text-white transition-colors duration-300 flex items-center gap-2"
                >
                  {user ? "View Profile" : "Sign In"} <span aria-hidden="true">→</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>
    </MainLayout>
  );
}
