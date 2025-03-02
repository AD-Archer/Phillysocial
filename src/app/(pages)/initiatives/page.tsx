'use client';
import Link from 'next/link';
import MainLayout from '@/layouts/MainLayout';
import { motion } from 'framer-motion';
import { FaHandsHelping, FaLeaf, FaRecycle, FaCalendarAlt, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';
import Image from 'next/image';

export default function Initiatives() {
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

  // Featured initiatives data
  const featuredInitiatives = [
    {
      title: "Philly Spring Cleanup",
      description: "Philadelphia's largest city-wide, single-day clean-up event. Since its 2008 launch, volunteers have removed more than 11.4 million pounds of trash from city streets.",
      icon: FaRecycle,
      date: "April 5, 2025",
      location: "Citywide",
      link: "https://www.phila.gov/programs/philly-spring-cleanup/",
      activities: ["Picking up trash", "Sweeping sidewalks", "Removing graffiti", "Painting benches", "Planting bulbs"]
    },
    {
      title: "PHS Community Gardens",
      description: "The Pennsylvania Horticultural Society supports over 170 community gardens and urban farms that provide fresh produce and green spaces in neighborhoods across Philadelphia.",
      icon: FaLeaf,
      date: "Year-round",
      location: "Various neighborhoods",
      link: "https://phsonline.org/programs/community-gardens",
      activities: ["Urban farming", "Food donation", "Community building", "Environmental education"]
    },
    {
      title: "Love Your Park Week",
      description: "A biannual celebration of Philadelphia's parks with service days, events, and volunteer opportunities to clean, green, and celebrate our city's parks.",
      icon: FaHandsHelping,
      date: "May 2025",
      location: "Parks throughout Philadelphia",
      link: "/initiatives",
      activities: ["Park cleanups", "Tree planting", "Trail maintenance", "Community events"]
    }
  ];

  // Upcoming events data
  const upcomingEvents = [
    {
      title: "Neighborhood Tree Planting",
      date: "March 15, 2025",
      location: "North Philadelphia",
      description: "Join us to plant 50 new trees in North Philadelphia neighborhoods."
    },
    {
      title: "Schuylkill River Cleanup",
      date: "April 22, 2025",
      location: "Schuylkill Banks",
      description: "Help clean up the Schuylkill River banks in honor of Earth Day."
    },
    {
      title: "Community Garden Workshop",
      date: "May 8, 2025",
      location: "Kensington",
      description: "Learn organic growing techniques from local urban farming experts."
    }
  ];

  // Success stories data
  const successStories = [
    {
      title: "South Philly Green Team",
      description: "A group of neighbors transformed a vacant lot into a thriving community garden that now provides fresh produce to local food pantries.",
      image: "/Logo.png"
    },
    {
      title: "West Philly Tree Tenders",
      description: "Volunteers planted over 200 trees in West Philadelphia, increasing tree canopy and improving air quality in the neighborhood.",
      image: "/Logo.png"
    }
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
              Community <span className="text-[#A5ACAF]">Initiatives</span>
            </h1>
            <p className="text-xl leading-8 text-white mb-8 max-w-3xl mx-auto">
              Join fellow Philadelphians in making our city cleaner, greener, and more connected through these community-driven initiatives.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="#featured" 
                  className="rounded-xl bg-[#A5ACAF] px-6 py-3 text-lg font-semibold text-[#003038] shadow-lg hover:bg-white hover:text-[#004C54] transition-all duration-300"
                >
                  Featured Initiatives
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="#events" 
                  className="rounded-xl bg-[#003940]/50 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-[#003940] transition-all duration-300"
                >
                  Upcoming Events
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="#stories" 
                  className="rounded-xl bg-[#003940]/50 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-[#003940] transition-all duration-300"
                >
                  Success Stories
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Featured Initiatives Section */}
        <section id="featured" className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.h2 
            className="text-4xl eagles-font text-center text-white mb-16 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Featured Initiatives
          </motion.h2>
          <motion.div 
            className="space-y-12"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {featuredInitiatives.map((initiative, index) => {
              const Icon = initiative.icon;
              return (
                <motion.div 
                  key={index}
                  className="bg-black/30 backdrop-blur-md rounded-xl p-8 shadow-xl"
                  variants={fadeInUp}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <div className="flex items-center mb-4">
                        <div className="bg-[#003940] rounded-full p-3 mr-4">
                          <Icon className="w-6 h-6 text-[#A5ACAF]" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">{initiative.title}</h3>
                      </div>
                      <p className="text-[#A5ACAF] text-lg mb-6">{initiative.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                          <h4 className="text-white font-semibold mb-2">When</h4>
                          <p className="text-[#A5ACAF] flex items-center">
                            <FaCalendarAlt className="mr-2" /> {initiative.date}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-2">Where</h4>
                          <p className="text-[#A5ACAF] flex items-center">
                            <FaMapMarkerAlt className="mr-2" /> {initiative.location}
                          </p>
                        </div>
                      </div>
                      <motion.div whileHover={{ x: 5 }}>
                        <Link 
                          href={initiative.link} 
                          className="text-white font-medium flex items-center"
                          target={initiative.link.startsWith('http') ? "_blank" : "_self"}
                        >
                          Learn more and get involved <FaArrowRight className="ml-2" />
                        </Link>
                      </motion.div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-6">
                      <h4 className="text-white font-semibold mb-4">Activities</h4>
                      <ul className="space-y-2">
                        {initiative.activities.map((activity, idx) => (
                          <li key={idx} className="text-[#A5ACAF] flex items-center">
                            <span className="w-2 h-2 bg-[#A5ACAF] rounded-full mr-2"></span>
                            {activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Upcoming Events Section */}
        <section id="events" className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.h2 
            className="text-4xl eagles-font text-center text-white mb-16 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Upcoming Events
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event, index) => (
              <motion.div 
                key={index}
                className="bg-black/30 backdrop-blur-md rounded-xl p-6 shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="bg-[#003940] text-white text-center py-2 px-4 rounded-lg mb-4">
                  {event.date}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                <p className="text-[#A5ACAF] mb-4 flex items-center">
                  <FaMapMarkerAlt className="mr-2" /> {event.location}
                </p>
                <p className="text-white">{event.description}</p>
                <motion.div 
                  className="mt-4"
                  whileHover={{ x: 5 }}
                >
                  <Link href="#" className="text-[#A5ACAF] hover:text-white transition-colors flex items-center">
                    Register now <FaArrowRight className="ml-2" />
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Success Stories Section */}
        <section id="stories" className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.h2 
            className="text-4xl eagles-font text-center text-white mb-16 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Success Stories
          </motion.h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {successStories.map((story, index) => (
              <motion.div 
                key={index}
                className="bg-black/30 backdrop-blur-md rounded-xl overflow-hidden shadow-xl"
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 relative mr-4">
                      <Image
                        src={story.image}
                        alt={story.title}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white">{story.title}</h3>
                  </div>
                  <p className="text-[#A5ACAF]">{story.description}</p>
                  <motion.div 
                    className="mt-4"
                    whileHover={{ x: 5 }}
                  >
                    <Link href="#" className="text-white font-medium flex items-center">
                      Read full story <FaArrowRight className="ml-2" />
                    </Link>
                  </motion.div>
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
              Ready to make a difference?
            </h2>
            <p className="text-xl leading-8 text-[#A5ACAF] mb-8">
              Join our community of volunteers and help make Philadelphia a cleaner, greener, and more connected city.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/signup"
                  className="rounded-xl bg-[#A5ACAF] px-8 py-4 text-lg font-semibold text-[#003038] shadow-lg hover:bg-white hover:text-[#004C54] transition-all duration-300 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#004C54]"
                >
                  Volunteer Today
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
  );
}
