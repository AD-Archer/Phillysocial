'use client';
import MainLayout from '@/layouts/MainLayout';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaGithub, FaMapMarkerAlt, FaPhone, FaUsers, FaHandsHelping, FaStore, FaCalendarAlt } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

export default function Contact() {
  // Add Eagles font and breathing gradient
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

  // Team members data with updated images
  const teamMembers = [
    {
      name: "Mohomed Souare",
      role: "Co-Founder, and Key Developer",
      bio: "Mohamed brings technical expertise and a passion for creating digital tools that solve real community problems.",
      image: "https://2ad5tl9u0f.ufs.sh/f/mVlrptEB35zZWRSjr6oGkhZc0HqtLiKVx6UwNY9rFfzj8DgC",
      email: "placeholder@email.com",
      github: "https://github.com/MO-fr",
      linkedin: "https://www.linkedin.com/in/mohamed-souare-8a61a2259/",
    },
    {
      name: "Antonio Archer",
      role: "Co-Founder, and Lead Developer",
      bio: "Antonio leads our development team with a focus on creating intuitive, accessible interfaces that connect Philadelphians.",
      image: "https://2ad5tl9u0f.ufs.sh/f/mVlrptEB35zZgXkiO09rgqXvswhp7V9inAWSNjdFcTPU04Co",
      email: "adarcher21@gmail.com",
      github: "https://github.com/ad-archer",
      linkedin: "https://www.linkedin.com/in/antonio-archer/",
    },
    {
      name: "Sianni Strickland",
      role: "Co-Founder, and Managing Lead",
      bio: "Sianni oversees operations and community engagement, ensuring Philly Social remains focused on serving the needs of our city.",
      image: "https://2ad5tl9u0f.ufs.sh/f/mVlrptEB35zZRu9boXVrI1y2gHJMVozdtwNDuO6Ev3qPksnc",
      email: "placeholder@email.com",
      github: "https://github.com/SunnySianni",
      linkedin: "https://www.linkedin.com/in/sianni-strickland-934059284//",
    },
    {
      name: "Bryan Gunawan",
      role: "Co-Founder, and Overseeing Developer",
      bio: "Bryan provides strategic direction and technical oversight, with a vision of using technology to strengthen Philadelphia's communities.",
      image: "https://2ad5tl9u0f.ufs.sh/f/mVlrptEB35zZjuXP5PB6AkuVRtqlLTQdpOHJ5GXICY9z3M2n",
      email: "bguna0050@launchpadphilly.org",
      github: "https://github.com/ManINeedToSleep",
      linkedin: "https://www.linkedin.com/in/bryan-gunawan-a537132b9/",
    }
  ];

  // Impact statistics
  const impactStats = [
    { number: "1000+", label: "Community Members", icon: FaUsers },
    { number: "50+", label: "Local Businesses", icon: FaStore },
    { number: "25+", label: "Community Initiatives", icon: FaHandsHelping },
    { number: "100+", label: "Neighborhood Events", icon: FaCalendarAlt }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen breathing-gradient bg-gradient-to-br from-[#003038] via-[#004C54] to-[#046A38] text-white">
        {/* Hero Section */}
        <section className="px-4 py-16 sm:py-24 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl eagles-font tracking-tight text-white sm:text-6xl mb-6 drop-shadow-lg">
              Contact <span className="text-[#A5ACAF]">Us</span>
            </h1>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-4xl mx-auto">
              <p className="text-xl leading-8 text-white mb-6">
                Have questions, suggestions, or want to get involved? Reach out to our team and we&apos;ll get back to you as soon as possible.
              </p>
              <p className="text-xl leading-8 text-white">
                Whether you&apos;re interested in joining our community, partnering with us, or just want to learn more about Philly Social, 
                we&apos;re here to help connect you with the resources and information you need.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Team Members Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.h2 
            className="text-4xl eagles-font text-center text-white mb-16 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Meet Our Team
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                className="group bg-black/30 backdrop-blur-md rounded-xl p-8 flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105 hover:bg-black/40"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="relative w-48 h-48 mb-6 rounded-full overflow-hidden border-4 border-[#A5ACAF] shadow-xl group-hover:border-white transition-colors duration-300">
                  {member.image && member.image.startsWith('http') ? (
                    <Image 
                      src={member.image} 
                      alt={member.name} 
                      fill
                      className="object-cover" 
                    />
                  ) : (
                    <Image 
                      src={member.image || "/placeholder.svg"} 
                      alt={member.name} 
                      fill 
                      className="object-cover" 
                    />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{member.name}</h3>
                <p className="text-[#A5ACAF] text-lg mb-4">{member.role}</p>
                <p className="text-white mb-6">{member.bio}</p>
                <div className="flex flex-col space-y-2 items-center mb-4">
                  <a 
                    href={`mailto:${member.email}`} 
                    className="text-white flex items-center hover:text-[#A5ACAF] transition-colors"
                  >
                    <FaEnvelope className="mr-2" /> {member.email}
                  </a>
                </div>
                <div className="flex space-x-6">
                  <a 
                    href={member.github} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#A5ACAF] hover:text-white transition-colors duration-300 font-medium"
                  >
                    GitHub
                  </a>
                  <a 
                    href={member.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#A5ACAF] hover:text-white transition-colors duration-300 font-medium"
                  >
                    LinkedIn
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact Information Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-8 shadow-xl h-full">
                <h2 className="text-3xl eagles-font text-white mb-8 drop-shadow-lg">Visit Our Office</h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-[#003940] rounded-full p-3 mr-4">
                      <FaMapMarkerAlt className="w-6 h-6 text-[#A5ACAF]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Address</h3>
                      <p className="text-[#A5ACAF]">
                        801 Market Street<br />
                        Philadelphia, PA 19102
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-[#003940] rounded-full p-3 mr-4">
                      <FaPhone className="w-6 h-6 text-[#A5ACAF]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Phone</h3>
                      <p className="text-[#A5ACAF]">(267) 225-6778</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-[#003940] rounded-full p-3 mr-4">
                      <FaEnvelope className="w-6 h-6 text-[#A5ACAF]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Email</h3>
                      <p className="text-[#A5ACAF]">aarch0004@launchpadphilly.org</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-8 shadow-xl mb-8">
                <h2 className="text-3xl eagles-font text-white mb-8 drop-shadow-lg">Office Hours</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-white">Monday - Friday</span>
                    <span className="text-[#A5ACAF]">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">Saturday</span>
                    <span className="text-[#A5ACAF]">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">Sunday</span>
                    <span className="text-[#A5ACAF]">Closed</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-8 shadow-xl">
                <h2 className="text-3xl eagles-font text-white mb-8 drop-shadow-lg">Connect With Us</h2>
                <p className="text-[#A5ACAF] text-lg mb-6">
                  Check out our GitHub repository to see our code, contribute to the project, or report issues.
                </p>
                <div className="flex justify-center">
                  <a 
                    href="https://github.com/ad-archer/phillysocial" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 bg-[#003940] hover:bg-[#004C54] text-white px-6 py-4 rounded-xl transition-all duration-300 text-lg font-medium"
                  >
                    <FaGithub size={24} />
                    Visit Our GitHub Repository
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Impact Stats Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div 
            className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl eagles-font text-center text-white mb-12 drop-shadow-lg">
              Our Growing Impact
            </h2>
            <p>Our planned growing impact this is not current</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {impactStats.map((stat, index) => {
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
          </motion.div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div 
            className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl eagles-font text-center text-white mb-12 drop-shadow-lg">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">How can I join Philly Social?</h3>
                <p className="text-[#A5ACAF]">
                  You can sign up for an account on our website by clicking the &quot;Get Started&quot; button on the homepage or visiting the signup page directly.
                </p>
              </div>
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Is Philly Social free to use?</h3>
                <p className="text-[#A5ACAF]">
                  Yes, Philly Social is completely free for all Philadelphia residents and those with connections to the city.
                </p>
              </div>
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">How can I list my business on Philly Social?</h3>
                <p className="text-[#A5ACAF]">
                  You can list your business by creating an account and visiting the &quot;Local Business&quot; section, where you&apos;ll find an option to add your business to our directory.
                </p>
              </div>
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">How can I get involved with community initiatives?</h3>
                <p className="text-[#A5ACAF]">
                  Visit our &quot;Initiatives&quot; page to see current community projects and events. You can sign up to volunteer or participate directly through the platform.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

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
              Join the Philly Social Community
            </h2>
            <p className="text-xl leading-8 text-[#A5ACAF] mb-8">
              Be part of a movement to strengthen Philadelphia&apos;s communities through digital connection and real-world action.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/signup"
                  className="rounded-xl bg-[#A5ACAF] px-8 py-4 text-lg font-semibold text-[#003038] shadow-lg hover:bg-white hover:text-[#004C54] transition-all duration-300 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#004C54]"
                >
                  Create Account
                </Link>
              </motion.div>
              <motion.div whileHover={{ x: 5 }}>
                <Link
                  href="/about"
                  className="text-lg font-semibold leading-6 text-[#A5ACAF] hover:text-white transition-colors duration-300 flex items-center gap-2"
                >
                  Learn More About Us <span aria-hidden="true">→</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>
    </MainLayout>
  );
}
