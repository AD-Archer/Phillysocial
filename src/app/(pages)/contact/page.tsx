'use client';
import MainLayout from '@/layouts/MainLayout';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaGithub, FaLinkedin, FaMapMarkerAlt, FaPhone, FaPaperPlane } from 'react-icons/fa';
import Image from 'next/image';

export default function Contact() {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState({ submitted: false, error: false });

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

  // Team members data
  const teamMembers = [
    {
      name: "Bryan Gunawan",
      role: "Co-Founder, Overseeing Developer",
      email: "bguna0050@launchpadphilly.org",
      image: "/Logo.png",
      github: "https://github.com/bryangunawan",
      linkedin: "https://linkedin.com/in/bryangunawan",
    },
    {
      name: "Sianni Strickland",
      role: "Co-Founder, Managing Lead",
      email: "placeholder@email.com",
      image: "/Logo.png",
      github: "https://github.com/siannistrickland",
      linkedin: "https://www.linkedin.com/in/sianni-strickland-934059284/",
    },
    {
      name: "Antonio Archer",
      role: "Co-Founder, Lead Developer",
      email: "placeholder@email.com",
      image: "/Logo.png",
      github: "https://github.com/ad-archer",
      linkedin: "https://www.linkedin.com/in/antonio-archer/",
    },
    {
      name: "Mohamed Souare",
      role: "Co-Founder, Key Developer",
      email: "placeholder@email.com",
      image: "/Logo.png",
      github: "https://github.com/MO-fr",
      linkedin: "https://www.linkedin.com/in/mohamed-souare-8a61a2259/",
    }
  ];

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real application, you would send the form data to a server here
    console.log('Form submitted:', formData);
    // Simulate successful submission
    setFormStatus({ submitted: true, error: false });
    // Reset form
    setFormData({ name: '', email: '', subject: '', message: '' });
    // Reset status after 5 seconds
    setTimeout(() => {
      setFormStatus({ submitted: false, error: false });
    }, 5000);
  };

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
            <p className="text-xl leading-8 text-white mb-8 max-w-3xl mx-auto">
              Have questions, suggestions, or want to get involved? Reach out to our team and we&apos;ll get back to you as soon as possible.
            </p>
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
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {teamMembers.map((member, index) => (
              <motion.div 
                key={index}
                className="bg-black/30 backdrop-blur-md rounded-xl p-6 flex flex-col items-center text-center"
                variants={fadeInUp}
                whileHover={{ y: -10 }}
              >
                <div className="relative w-32 h-32 mb-6 rounded-full overflow-hidden border-4 border-[#A5ACAF]">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                <p className="text-[#A5ACAF] mb-4">{member.role}</p>
                <div className="flex flex-col space-y-2 items-center mb-4">
                  <a 
                    href={`mailto:${member.email}`} 
                    className="text-white flex items-center hover:text-[#A5ACAF] transition-colors"
                  >
                    <FaEnvelope className="mr-2" /> {member.email}
                  </a>
                </div>
                <div className="flex space-x-4">
                  <a 
                    href={member.github} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#A5ACAF] hover:text-white transition-colors p-2"
                  >
                    <FaGithub size={24} />
                  </a>
                  <a 
                    href={member.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#A5ACAF] hover:text-white transition-colors p-2"
                  >
                    <FaLinkedin size={24} />
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Contact Form Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-black/30 backdrop-blur-md rounded-xl p-8 shadow-xl"
            >
              <h2 className="text-3xl eagles-font text-white mb-8 drop-shadow-lg">Send Us a Message</h2>
              {formStatus.submitted ? (
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6">
                  <p className="text-white">Thank you for your message! We&apos;ll get back to you soon.</p>
                </div>
              ) : formStatus.error ? (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
                  <p className="text-white">There was an error sending your message. Please try again.</p>
                </div>
              ) : null}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-[#A5ACAF] mb-2">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-black/30 text-white border border-[#A5ACAF]/30 focus:border-[#A5ACAF] focus:outline-none focus:ring-2 focus:ring-[#A5ACAF]/50"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-[#A5ACAF] mb-2">Your Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-black/30 text-white border border-[#A5ACAF]/30 focus:border-[#A5ACAF] focus:outline-none focus:ring-2 focus:ring-[#A5ACAF]/50"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-[#A5ACAF] mb-2">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-black/30 text-white border border-[#A5ACAF]/30 focus:border-[#A5ACAF] focus:outline-none focus:ring-2 focus:ring-[#A5ACAF]/50"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-[#A5ACAF] mb-2">Your Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg bg-black/30 text-white border border-[#A5ACAF]/30 focus:border-[#A5ACAF] focus:outline-none focus:ring-2 focus:ring-[#A5ACAF]/50"
                  ></textarea>
                </div>
                <motion.button
                  type="submit"
                  className="rounded-xl bg-[#A5ACAF] px-8 py-4 text-lg font-semibold text-[#003038] shadow-lg hover:bg-white hover:text-[#004C54] transition-all duration-300 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#004C54] w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center justify-center">
                    Send Message <FaPaperPlane className="ml-2" />
                  </span>
                </motion.button>
              </form>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-8 shadow-xl mb-8">
                <h2 className="text-3xl eagles-font text-white mb-8 drop-shadow-lg">Visit Our Office</h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-[#003940] rounded-full p-3 mr-4">
                      <FaMapMarkerAlt className="w-6 h-6 text-[#A5ACAF]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Address</h3>
                      <p className="text-[#A5ACAF]">
                        1500 Market Street<br />
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
                      <p className="text-[#A5ACAF]">(215) 555-0123</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-[#003940] rounded-full p-3 mr-4">
                      <FaEnvelope className="w-6 h-6 text-[#A5ACAF]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Email</h3>
                      <p className="text-[#A5ACAF]">contact@phillysocial.org</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-8 shadow-xl">
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
            </motion.div>
          </div>
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
      </div>
    </MainLayout>
  );
}
