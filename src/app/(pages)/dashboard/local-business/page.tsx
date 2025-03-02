'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaStore, FaUtensils, FaCoffee, FaShoppingBag, FaSearch, FaMapMarkerAlt, FaStar, FaExternalLinkAlt } from 'react-icons/fa';
import Image from 'next/image';

export default function LocalBusiness() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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
        staggerChildren: 0.1
      }
    }
  };

  // Categories
  const categories = [
    { id: 'all', name: 'All', icon: FaStore },
    { id: 'restaurants', name: 'Restaurants', icon: FaUtensils },
    { id: 'cafes', name: 'Cafes', icon: FaCoffee },
    { id: 'retail', name: 'Retail', icon: FaShoppingBag }
  ];

  // Featured businesses data
  const businesses = [
    {
      id: 1,
      name: "Reading Terminal Market",
      category: "retail",
      description: "Historic farmers market with diverse food vendors, local produce, and specialty shops under one roof since 1893.",
      address: "51 N 12th St, Philadelphia, PA 19107",
      rating: 4.8,
      image: "/img/places/reading-terminal-market-sign.png",
      website: "https://readingterminalmarket.org/",
      featured: true
    },
    {
      id: 2,
      name: "Zahav",
      category: "restaurants",
      description: "Award-winning Israeli restaurant by Chef Michael Solomonov offering modern takes on traditional Middle Eastern dishes.",
      address: "237 St James Pl, Philadelphia, PA 19106",
      rating: 4.9,
      image: "/img/places/zahay.png",
      website: "https://www.zahavrestaurant.com/",
      featured: true
    },
    {
      id: 3,
      name: "La Colombe Coffee Roasters",
      category: "cafes",
      description: "Philadelphia-born coffee company known for their draft lattes and ethically sourced beans.",
      address: "1335 Frankford Ave, Philadelphia, PA 19125",
      rating: 4.7,
      image: "/img/places/cofee.png",
      website: "https://www.lacolombe.com/",
      featured: true
    },
    {
      id: 4,
      name: "Di Bruno Bros.",
      category: "retail",
      description: "Gourmet food market specializing in cheeses, charcuterie, and specialty foods since 1939.",
      address: "930 S 9th St, Philadelphia, PA 19147",
      rating: 4.6,
      image: "/Logo.png",
      website: "https://dibruno.com/",
      featured: false
    },
    {
      id: 5,
      name: "Federal Donuts",
      category: "restaurants",
      description: "Popular spot for unique donut flavors and Korean-style fried chicken.",
      address: "1219 S 2nd St, Philadelphia, PA 19147",
      rating: 4.5,
      image: "/Logo.png",
      website: "https://www.federaldonuts.com/",
      featured: false
    },
    {
      id: 6,
      name: "Elixr Coffee Roasters",
      category: "cafes",
      description: "Specialty coffee shop with a focus on single-origin beans and pour-over brewing methods.",
      address: "207 S Sydenham St, Philadelphia, PA 19102",
      rating: 4.7,
      image: "/Logo.png",
      website: "https://elixrcoffee.com/",
      featured: false
    },
    {
      id: 7,
      name: "LUHV Vegan Deli",
      category: "restaurants",
      description: "Family-owned vegan deli offering plant-based sandwiches, soups, and prepared foods.",
      address: "51 N 12th St, Philadelphia, PA 19107",
      rating: 4.6,
      image: "/Logo.png",
      website: "https://luhvfood.com/",
      featured: false
    },
    {
      id: 8,
      name: "Philadelphia Independents",
      category: "retail",
      description: "Boutique shop featuring locally made art, jewelry, clothing, and gifts from Philadelphia artists.",
      address: "35 N 3rd St, Philadelphia, PA 19106",
      rating: 4.8,
      image: "/Logo.png",
      website: "https://philadelphiaindependents.com/",
      featured: false
    },
    {
      id: 9,
      name: "Rival Bros Coffee",
      category: "cafes",
      description: "Craft coffee roaster with a commitment to quality and sustainability.",
      address: "2400 Lombard St, Philadelphia, PA 19146",
      rating: 4.6,
      image: "/Logo.png",
      website: "https://rivalbros.com/",
      featured: false
    }
  ];

  // Filter businesses based on search and category
  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          business.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || business.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Featured businesses
  const featuredBusinesses = businesses.filter(business => business.featured);

  return (
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
            Support <span className="text-[#A5ACAF]">Local</span>
          </h1>
          <p className="text-xl leading-8 text-white mb-8 max-w-3xl mx-auto">
            Discover and support Philadelphia&apos;s vibrant small businesses that make our city unique.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for local businesses..."
                className="w-full px-5 py-4 pr-12 rounded-xl bg-black/30 backdrop-blur-md text-white border border-[#A5ACAF]/30 focus:border-[#A5ACAF] focus:outline-none focus:ring-2 focus:ring-[#A5ACAF]/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#A5ACAF]">
                <FaSearch size={20} />
              </div>
            </div>
          </div>
          
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <motion.button
                  key={category.id}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-[#A5ACAF] text-[#003038] font-semibold'
                      : 'bg-black/30 text-white hover:bg-black/40'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={16} />
                  <span>{category.name}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Featured Businesses Section */}
      {featuredBusinesses.length > 0 && (
        <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.h2 
            className="text-4xl eagles-font text-center text-white mb-16 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Featured Businesses
          </motion.h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {featuredBusinesses.map((business) => (
              <motion.div 
                key={business.id}
                className="bg-black/30 backdrop-blur-md rounded-xl overflow-hidden shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -10 }}
              >
                <div className="h-48 relative">
                  <Image
                    src={business.image}
                    alt={business.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-[#003940] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {business.category.charAt(0).toUpperCase() + business.category.slice(1)}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{business.name}</h3>
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400 mr-2">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < Math.floor(business.rating) ? "text-yellow-400" : "text-gray-400"} />
                      ))}
                    </div>
                    <span className="text-[#A5ACAF]">{business.rating}</span>
                  </div>
                  <p className="text-[#A5ACAF] mb-4">{business.description}</p>
                  <p className="text-white flex items-center mb-4">
                    <FaMapMarkerAlt className="mr-2 text-[#A5ACAF]" /> {business.address}
                  </p>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link 
                      href={business.website} 
                      target="_blank" 
                      className="text-white font-medium flex items-center"
                    >
                      Visit website <FaExternalLinkAlt className="ml-2" />
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* All Businesses Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.h2 
          className="text-4xl eagles-font text-center text-white mb-16 drop-shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {selectedCategory === 'all' ? 'All Businesses' : `${categories.find(c => c.id === selectedCategory)?.name}`}
        </motion.h2>
        
        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-[#A5ACAF]">No businesses found matching your search criteria.</p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {filteredBusinesses.map((business) => (
              <motion.div 
                key={business.id}
                className="bg-black/30 backdrop-blur-md rounded-xl overflow-hidden shadow-xl"
                variants={fadeInUp}
                whileHover={{ y: -5 }}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{business.name}</h3>
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400 mr-2">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} size={14} className={i < Math.floor(business.rating) ? "text-yellow-400" : "text-gray-400"} />
                      ))}
                    </div>
                    <span className="text-[#A5ACAF] text-sm">{business.rating}</span>
                  </div>
                  <p className="text-[#A5ACAF] text-sm mb-4">{business.description}</p>
                  <p className="text-white text-sm flex items-center mb-4">
                    <FaMapMarkerAlt className="mr-2 text-[#A5ACAF]" /> {business.address}
                  </p>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link 
                      href={business.website} 
                      target="_blank" 
                      className="text-white text-sm font-medium flex items-center"
                    >
                      Visit website <FaExternalLinkAlt className="ml-2" />
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Small Business Saturday Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl eagles-font text-white mb-6 drop-shadow-lg">
                Small Business Saturday
              </h2>
              <p className="text-[#A5ACAF] mb-6">
                Mark your calendar for Small Business Saturday on November 30, 2024. It&apos;s a day dedicated to supporting local businesses that create jobs, boost the economy, and preserve neighborhoods across the country.
              </p>
              <p className="text-white mb-6">
                When you shop small, you make a big impact. For every dollar spent at a small business in the U.S., approximately 67 cents stays in the local community.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="#" 
                  className="inline-block rounded-xl bg-[#A5ACAF] px-6 py-3 text-lg font-semibold text-[#003038] shadow-lg hover:bg-white hover:text-[#004C54] transition-all duration-300"
                >
                  Learn More
                </Link>
              </motion.div>
            </div>
            <div className="relative h-64 lg:h-auto">
              <div className="absolute inset-0 bg-[#A5ACAF]/10 rounded-xl"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[#A5ACAF] text-lg mb-2">Save the Date</p>
                  <h3 className="text-4xl font-bold text-white mb-2">November 30</h3>
                  <p className="text-white">Small Business Saturday 2024</p>
                </div>
              </div>
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
            Own a local business?
          </h2>
          <p className="text-xl leading-8 text-[#A5ACAF] mb-8">
            Join our directory and connect with the Philly Social community. Get featured and grow your customer base.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/login?mode=signup"
                className="rounded-xl bg-[#A5ACAF] px-8 py-4 text-lg font-semibold text-[#003038] shadow-lg hover:bg-white hover:text-[#004C54] transition-all duration-300 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#004C54]"
              >
                List Your Business
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
  );
}
