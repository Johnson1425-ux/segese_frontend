import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Heart,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  ChevronRight,
  Stethoscope,
  AlertCircle,
  Pill,
  Microscope,
  UserCheck,
  Clock,
  Shield,
  Award,
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

export default function ServicesPage() {
  const [activeLink, setActiveLink] = useState("services");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setActiveLink("services");
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const services = [
    {
      title: "Outpatient & Inpatient Services",
      description:
        "We provide comprehensive care for both inpatients and outpatients, ensuring a seamless medical experience with 24/7 monitoring and dedicated healthcare staff.",
      icon: Stethoscope,
      gradient: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      features: [
        "24/7 Patient Monitoring",
        "Comfortable Private Rooms",
        "Comprehensive Medical Care"
      ]
    },
    {
      title: "Emergency Care",
      description:
        "Our emergency unit operates round the clock to manage urgent and critical cases, prioritizing rapid response and professional treatment.",
      icon: AlertCircle,
      gradient: "from-red-500 to-red-600",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      features: [
        "24/7 Emergency Response",
        "Trauma Care",
        "Critical Care Unit"
      ]
    },
    {
      title: "Pharmacy & Medication",
      description:
        "Our pharmacy ensures patients have access to safe, high-quality, and affordable medications with professional guidance on proper usage.",
      icon: Pill,
      gradient: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      features: [
        "Quality Medications",
        "Professional Consultation",
        "Affordable Pricing"
      ]
    },
    {
      title: "Diagnostic & Laboratory Services",
      description:
        "We offer a full range of diagnostic tests and laboratory services using modern equipment for accurate and timely results.",
      icon: Microscope,
      gradient: "from-teal-500 to-teal-600",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      features: [
        "Modern Lab Equipment",
        "Fast Results",
        "Comprehensive Testing"
      ]
    },
    {
      title: "Specialized Consultations",
      description:
        "Our specialists provide personalized consultations across various fields of medicine to meet the unique needs of each patient.",
      icon: UserCheck,
      gradient: "from-green-500 to-green-600",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      features: [
        "Expert Specialists",
        "Personalized Care Plans",
        "Follow-up Support"
      ]
    },
  ];

  const serviceStats = [
    { icon: Clock, number: "24/7", label: "Available" },
    { icon: Award, number: "15+", label: "Years Experience" },
    { icon: Shield, number: "100%", label: "Quality Care" },
    { icon: Heart, number: "5000+", label: "Happy Patients" }
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
            Our Services
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 max-w-3xl mx-auto px-4">
            Comprehensive healthcare services designed to meet all your medical needs
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-8 sm:mt-12 max-w-4xl mx-auto">
            {serviceStats.map((stat, idx) => {
              const IconComponent = stat.icon;
              return (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center">
                  <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white mx-auto mb-2" />
                  <div className="text-xl sm:text-2xl font-bold text-white">{stat.number}</div>
                  <div className="text-xs sm:text-sm text-blue-100">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <main className="flex-1 px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              What We Offer
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              From routine check-ups to specialized treatments, we're here to support your health journey
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {services.map((service, idx) => {
              const IconComponent = service.icon;
              
              return (
                <div
                  key={idx}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
                >
                  <div className="flex flex-col">
                    {/* Icon Section */}
                    <div className={`bg-gradient-to-br ${service.gradient} p-6 sm:p-8 md:p-12 relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full -mr-24 sm:-mr-32 -mt-24 sm:-mt-32"></div>
                      <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-full -ml-16 sm:-ml-24 -mb-16 sm:-mb-24"></div>
                      
                      <div className={`${service.iconBg} w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10`}>
                        <IconComponent className={`w-8 h-8 sm:w-10 sm:h-10 ${service.iconColor}`} />
                      </div>
                      
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 relative z-10">
                        {service.title}
                      </h3>

                      {/* Features List */}
                      <div className="space-y-2 relative z-10">
                        {service.features.map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-center text-white/90">
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Description Section */}
                    <div className="p-6 sm:p-8 md:p-12">
                      <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed mb-4 sm:mb-6">
                        {service.description}
                      </p>
                      
                      <button className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors duration-200 text-sm sm:text-base">
                        Learn More
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="mt-12 sm:mt-16 md:mt-20 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center shadow-2xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Need Medical Assistance?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Our team is ready to provide you with the best healthcare services. Contact us today!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              
                href="tel:+255762948291"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-200 transition-all duration-300 shadow-lg font-semibold text-sm sm:text-base"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Call Now
              </a>
              
                href="/patient-login"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-blue-700 text-white border-2 border-white rounded-lg hover:bg-blue-800 transition-all duration-300 font-semibold text-sm sm:text-base"
              >
                Book Appointment
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
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