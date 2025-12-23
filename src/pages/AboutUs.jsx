import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Target,
  Users,
  Heart,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  ChevronRight,
  Award,
  Shield,
  Clock,
  HeartHandshake,
  User,
  UserCog,
  Menu,
  X
} from "lucide-react";

// Sign In Dropdown Component
function SignInDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 md:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 shadow-md hover:shadow-lg text-sm md:text-base"
      >
        Sign In
        <ChevronRight className={`w-4 h-4 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="py-2">
            <a
              href="/login"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 group"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Hospital Portal</div>
                <div className="text-xs text-gray-500">For hospital staff</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
            </a>

            <div className="border-t border-gray-100 my-1"></div>

            <a
              href="https://fufumo-pharmacy.com/"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors duration-200 group"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-teal-200 transition-colors">
                <UserCog className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Pharmacy Portal</div>
                <div className="text-xs text-gray-500">For Fufumo staff members</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AboutUs() {
  const [activeLink, setActiveLink] = useState("about");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setActiveLink("about");
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const aboutItems = [
    {
      title: "Who We Are",
      description:
        "Segese Medical Clinic & Fufumo Pharmacy is a modern healthcare facility dedicated to providing comprehensive medical services to the community. We combine cutting-edge medical technology with compassionate care.",
      gradient: "from-blue-500 to-blue-600",
      icon: Building2,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Our Mission",
      description:
        "We are committed to delivering patient-centered, high-quality medical care tailored to each individual's needs. Our goal is to improve health outcomes and enhance the quality of life for all our patients.",
      gradient: "from-teal-500 to-teal-600",
      icon: Target,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600"
    },
    {
      title: "Our Team",
      description:
        "A dedicated staff of skilled doctors, nurses, and pharmacists, working together to improve patient health and well-being. Our team brings years of experience and specialized expertise.",
      gradient: "from-purple-500 to-purple-600",
      icon: Users,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      title: "Our Partners",
      description:
        "We work with NHIF, NSSF, BRITAM, and ASSEMBLE to ensure accessibility and affordability of healthcare services for all. We're committed to making quality healthcare available to everyone.",
      gradient: "from-green-500 to-green-600",
      icon: HeartHandshake,
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
  ];

  const values = [
    {
      icon: Heart,
      title: "Compassion",
      description: "We treat every patient with empathy and respect"
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We strive for the highest standards in healthcare"
    },
    {
      icon: Shield,
      title: "Integrity",
      description: "We uphold ethical practices in all we do"
    },
    {
      icon: Clock,
      title: "Availability",
      description: "We're here for you 24/7 when you need us"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Top Navbar */}
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white shadow-lg py-3' 
            : 'bg-white/95 backdrop-blur-sm shadow-md py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <NavLink to="/home" className="flex items-center space-x-2 cursor-pointer group">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg transform group-hover:scale-110 transition-transform duration-300 bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: "url('/SMC Logo.png')" }}
              ></div>
              <span className="text-sm sm:text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                SEGESE MEDICAL
              </span>
            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 lg:space-x-8 text-gray-700 font-medium">
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  `hover:text-blue-600 transition-colors duration-200 ${
                    isActive ? "text-blue-600 font-semibold" : ""
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/our-services"
                className={({ isActive }) =>
                  `hover:text-blue-600 transition-colors duration-200 ${
                    isActive ? "text-blue-600 font-semibold" : ""
                  }`
                }
              >
                Services
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `hover:text-blue-600 transition-colors duration-200 ${
                    isActive ? "text-blue-600 font-semibold" : ""
                  }`
                }
              >
                About Us
              </NavLink>
              <a
                href="#contact"
                className="hover:text-blue-600 transition-colors duration-200"
              >
                Contact
              </a>
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center gap-2 sm:gap-4">
              <SignInDropdown />
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 space-y-2">
              <NavLink
                to="/home"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                    isActive ? "bg-blue-50 text-blue-600 font-semibold" : ""
                  }`
                }
              >
                Home
              </NavLink>

              <NavLink
                to="/our-services"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                    isActive ? "bg-blue-50 text-blue-600 font-semibold" : ""
                  }`
                }
              >
                Services
              </NavLink>

              <NavLink
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                    isActive ? "bg-blue-50 text-blue-600 font-semibold" : ""
                  }`
                }
              >
                About Us
              </NavLink>

              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                Contact
              </a>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500 rounded-full opacity-20 blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-700 rounded-full opacity-20 blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-6">
            About Us
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 max-w-3xl mx-auto px-4">
            Learn more about our commitment to providing exceptional healthcare services to our community
          </p>
        </div>
      </section>

      {/* Main About Section */}
      <main className="flex-1 px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          {/* About Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16 md:mb-20">
            {aboutItems.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={idx}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  {/* Icon Header */}
                  <div className={`bg-gradient-to-br ${item.gradient} p-6 sm:p-8 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-white/10 rounded-full -mr-16 sm:-mr-20 -mt-16 sm:-mt-20"></div>
                    <div className={`${item.iconBg} w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      <IconComponent className={`w-7 h-7 sm:w-8 sm:h-8 ${item.iconColor}`} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white relative z-10">
                      {item.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <div className="p-6 sm:p-8">
                    <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Our Values Section */}
          <div className="mb-12 sm:mb-16 md:mb-20">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Our Core Values
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {values.map((value, idx) => {
                const IconComponent = value.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl shadow-md p-5 sm:p-6 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                      {value.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center shadow-2xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Ready to Experience Quality Healthcare?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Join thousands of satisfied patients who trust us with their health
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <NavLink
                to="/our-services"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-200 transition-all duration-300 shadow-lg font-semibold text-sm sm:text-base"
              >
                View Our Services
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </NavLink>
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-blue-700 text-white border-2 border-white rounded-lg hover:bg-blue-800 transition-all duration-300 font-semibold text-sm sm:text-base"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Contact */}
      <footer
        id="contact"
        className="bg-gray-900 text-gray-300 px-4 sm:px-6 py-10 sm:py-12"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: "url('/SMC Logo.png')" }}
                  ></div>
                </div>
                <span className="text-lg sm:text-xl font-bold text-white">Segese Medical</span>
              </div>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Providing quality healthcare services to the community with compassion and excellence.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-4">Contact Us</h4>
              <div className="space-y-3 text-sm sm:text-base">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 mr-3 mt-1 text-blue-400 flex-shrink-0" />
                  <span>Segese - Msalala, KAHAMA</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-blue-400 flex-shrink-0" />
                  <a href="mailto:publichope2@gmail.com" className="hover:text-white transition-colors break-all">
                    publichope2@gmail.com
                  </a>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 mr-3 text-blue-400 flex-shrink-0" />
                  <a href="tel:+255762948291" className="hover:text-white transition-colors">
                    +255 762 948 291
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-300">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-400 transition-colors duration-300">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://www.instagram.com/segese_medical_clinic_?igsh=cWJrN3Z6YYXVxZzZp" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-pink-600 transition-colors duration-300">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 sm:pt-8 text-center text-sm sm:text-base text-gray-400">
            <p>&copy; 2025 Segese Medical Clinic & Fufumo Pharmacy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}