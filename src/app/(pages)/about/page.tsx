'use client';
import Link from "next/link"
import Image from "next/image"
import MainLayout from '@/layouts/MainLayout';
import { motion } from 'framer-motion';
import { FaUsers, FaHandsHelping, FaStore, FaCalendarAlt, FaHeart, FaCity } from 'react-icons/fa';
import { useEffect } from 'react';

export default function About() {
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

  // Animation variants
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

  // Core values data
  const coreValues = [
    {
      title: "Community First",
      description: "We believe in the power of community to create positive change. Every feature and initiative on Philly Social is designed to strengthen community bonds.",
      icon: FaUsers
    },
    {
      title: "Accessibility",
      description: "We're committed to making our platform accessible to all Philadelphians, regardless of technical ability, background, or neighborhood.",
      icon: FaHeart
    },
    {
      title: "Local Impact",
      description: "We focus on initiatives that have a direct, positive impact on Philadelphia neighborhoods, supporting local businesses and community projects.",
      icon: FaCity
    },
    {
      title: "Collaboration",
      description: "We foster collaboration between residents, businesses, and community organizations to address challenges and create opportunities together.",
      icon: FaHandsHelping
    }
  ];

  // Impact statistics
  const impactStats = [
    { number: "1000+", label: "Community Members", icon: FaUsers },
    { number: "50+", label: "Local Businesses", icon: FaStore },
    { number: "25+", label: "Community Initiatives", icon: FaHandsHelping },
    { number: "100+", label: "Neighborhood Events", icon: FaCalendarAlt }
  ];

  // Founders data
  const founders = [
    {
      name: "Mohomed Souare",
      role: "Co-Founder, and Key Developer",
      bio: "Mohamed brings technical expertise and a passion for creating digital tools that solve real community problems.",
      image: "https://2ad5tl9u0f.ufs.sh/f/mVlrptEB35zZWRSjr6oGkhZc0HqtLiKVx6UwNY9rFfzj8DgC",
      github: "https://github.com/MO-fr",
      linkedin: "https://www.linkedin.com/in/mohamed-souare-8a61a2259/",
    },
    {
      name: "Antonio Archer",
      role: "Co-Founder, and Lead Developer",
      bio: "Antonio leads our development team with a focus on creating intuitive, accessible interfaces that connect Philadelphians.",
      image: "https://2ad5tl9u0f.ufs.sh/f/mVlrptEB35zZgXkiO09rgqXvswhp7V9inAWSNjdFcTPU04Co",
      github: "https://github.com/ad-archer",
      linkedin: "https://www.linkedin.com/in/antonio-archer/",
    },
    {
      name: "Sianni Strickland",
      role: "Co-Founder, and Managing Lead",
      bio: "Sianni oversees operations and community engagement, ensuring Philly Social remains focused on serving the needs of our city.",
      image: "https://2ad5tl9u0f.ufs.sh/f/mVlrptEB35zZRu9boXVrI1y2gHJMVozdtwNDuO6Ev3qPksnc",
      github: "https://github.com/SunnySianni",
      linkedin: "https://www.linkedin.com/in/sianni-strickland-934059284//",
    },
    {
      name: "Bryan Gunawan",
      role: "Co-Founder, and Overseeing Developer",
      bio: "Bryan provides strategic direction and technical oversight, with a vision of using technology to strengthen Philadelphia's communities.",
      image: "https://2ad5tl9u0f.ufs.sh/f/mVlrptEB35zZjuXP5PB6AkuVRtqlLTQdpOHJ5GXICY9z3M2n",
      github: "https://github.com/ManINeedToSleep",
      linkedin: "https://www.linkedin.com/in/bryan-gunawan-a537132b9/",
    },
  ];

  // Timeline milestones
  const timeline = [
    {
      year: "2025",
      title: "The Idea",
      description: "Philly Social was conceived as a solution to connect Philadelphia's diverse neighborhoods and communities in a digital space."
    },
    {
      year: "2025",
      title: "Launch",
      description: "Our platform launched with core features focused on community discussions, local business support, and neighborhood initiatives."
    },
    {
      year: "2025",
      title: "Community Growth",
      description: "Expanded to include more neighborhoods and partnered with local organizations to increase our impact across Philadelphia."
    },
    {
      year: "2026",
      title: "Future Vision",
      description: "Planning to introduce new features for neighborhood-specific resources, emergency communications, and expanded community organizing tools."
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen breathing-gradient bg-gradient-to-br from-[#003038] via-[#004C54] to-[#046A38] text-white">
        {/* Hero Section */}
        <section className="px-4 py-24 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl eagles-font tracking-tight text-white sm:text-7xl mb-8 drop-shadow-lg">
              About <span className="text-[#A5ACAF]">Philly Social</span>
            </h1>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-4xl mx-auto">
              <p className="text-xl leading-8 text-white mb-6">
                Philly Social is a community-driven platform designed to bring everyone in Philadelphia—both locals and those
                with Philly roots—into a single, accessible space for real-time discussions and collaboration.
              </p>
              <p className="text-xl leading-8 text-white mb-6">
                Our mission is to strengthen Philadelphia&apos;s communities by creating digital connections that lead to real-world impact. 
                We believe that when neighbors can easily connect, share resources, and organize around common goals, our entire city benefits.
              </p>
              <p className="text-xl leading-8 text-white">
                Whether it&apos;s neighborhood improvements, cultural events, supporting local businesses, or city-wide initiatives, 
                we&apos;re providing a space where the Philly community can come together—anytime, anywhere—to make our city even better.
              </p>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/signup"
                  className="rounded-xl bg-[#A5ACAF] px-8 py-4 text-lg font-semibold text-[#003038] shadow-lg hover:bg-white hover:text-[#004C54] transition-all duration-300 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#004C54]"
                >
                  Join Our Community
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/initiatives"
                  className="rounded-xl bg-[#003940]/50 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-[#003940] transition-all duration-300"
                >
                  Explore Initiatives
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Our Purpose Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.h2 
            className="text-4xl eagles-font text-center text-white mb-16 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Our Purpose
          </motion.h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-8 shadow-xl h-full">
                <h3 className="text-2xl font-bold text-white mb-6">Connecting Philadelphia</h3>
                <p className="text-[#A5ACAF] text-lg mb-6">
                  Philadelphia is a city of neighborhoods, each with its own character and community. But too often, these communities 
                  remain disconnected from each other, missing opportunities for collaboration and mutual support.
                </p>
                <p className="text-[#A5ACAF] text-lg mb-6">
                  Philly Social bridges these gaps by creating a digital town square where residents from Fishtown to South Philly, 
                  from Germantown to Center City, can connect, share resources, and work together on issues that matter.
                </p>
                <p className="text-white text-lg">
                  Our platform is designed to foster meaningful connections that translate into real-world action and community building.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-8 shadow-xl h-full">
                <h3 className="text-2xl font-bold text-white mb-6">Supporting Local Impact</h3>
                <p className="text-[#A5ACAF] text-lg mb-6">
                  We believe that thriving local businesses and community initiatives are the backbone of a healthy city. That&apos;s why 
                  Philly Social puts special emphasis on highlighting and supporting these vital parts of our community.
                </p>
                <p className="text-[#A5ACAF] text-lg mb-6">
                  From promoting neighborhood clean-ups to showcasing local restaurants, from organizing community gardens to 
                  facilitating neighborhood watch programs, our platform provides the digital infrastructure for real-world impact.
                </p>
                <p className="text-white text-lg">
                  By making it easier to discover, support, and participate in local initiatives, we help strengthen the fabric of our city.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.h2 
            className="text-4xl eagles-font text-center text-white mb-16 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Our Core Values
          </motion.h2>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {coreValues.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div 
                  key={index}
                  className="bg-black/30 backdrop-blur-md rounded-xl p-8 flex flex-col items-start transform transition-all duration-300 hover:scale-105 hover:bg-black/40"
                  variants={fadeInUp}
                >
                  <div className="bg-[#003940] rounded-full p-4 mb-6">
                    <Icon className="w-8 h-8 text-[#A5ACAF]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{value.title}</h3>
                  <p className="text-[#A5ACAF] text-lg">{value.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
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

        {/* Timeline Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.h2 
            className="text-4xl eagles-font text-center text-white mb-16 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Our Journey
          </motion.h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-[#A5ACAF]/30"></div>
            
            <div className="space-y-12">
              {timeline.map((milestone, index) => (
                <motion.div 
                  key={index}
                  className={`relative flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 shadow-xl">
                      <h3 className="text-2xl font-bold text-white mb-2">{milestone.title}</h3>
                      <p className="text-[#A5ACAF]">{milestone.description}</p>
                    </div>
                  </div>
                  
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-[#004C54] border-4 border-[#A5ACAF] flex items-center justify-center z-10">
                    <span className="text-white font-bold">{milestone.year}</span>
                  </div>
                  
                  <div className="w-1/2"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Founders Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.h2 
            className="text-4xl eagles-font text-center text-white mb-16 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Our Founders
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {founders.map((founder, index) => (
              <motion.div
                key={index}
                className="group bg-black/30 backdrop-blur-md rounded-xl p-8 flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105 hover:bg-black/40"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="relative w-48 h-48 mb-6 rounded-full overflow-hidden border-4 border-[#A5ACAF] shadow-xl group-hover:border-white transition-colors duration-300">
                  {founder.image && founder.image.startsWith('http') ? (
                    <Image 
                      src={founder.image} 
                      alt={founder.name} 
                      fill
                      className="object-cover" 
                    />
                  ) : (
                    <Image 
                      src={founder.image || "/placeholder.svg"} 
                      alt={founder.name} 
                      fill 
                      className="object-cover" 
                    />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{founder.name}</h3>
                <p className="text-[#A5ACAF] text-lg mb-4">{founder.role}</p>
                <p className="text-white mb-6">{founder.bio}</p>
                <div className="flex space-x-6">
                  <a 
                    href={founder.github} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#A5ACAF] hover:text-white transition-colors duration-300 font-medium"
                  >
                    GitHub
                  </a>
                  <a 
                    href={founder.linkedin} 
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
                  href="/contact"
                  className="text-lg font-semibold leading-6 text-[#A5ACAF] hover:text-white transition-colors duration-300 flex items-center gap-2"
                >
                  Contact Us <span aria-hidden="true">→</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>
    </MainLayout>
  )
}