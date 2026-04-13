import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { 
  Users, 
  Shield, 
  Pill, 
  Clock,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  ChevronRight,
  Heart,
  Award,
  Activity,
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
                <UserCog className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Hospital Portal</div>
                <div className="text-xs text-gray-500">For hospital staff members</div>
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
                <User className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Pharmacy Portal</div>
                <div className="text-xs text-gray-500">For fufumo staff</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [activeLink, setActiveLink] = useState("home");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const sections = ["home", "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveLink("home");
    setMobileMenuOpen(false);
  };

  const infoItems = [
    {
      title: "SKILLED DOCTORS",
      description:
        "Our team of experienced and certified doctors are dedicated to providing exceptional healthcare services with compassion and expertise.",
      gradient: "from-blue-500 to-blue-600",
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "INSURANCES",
      description:
        "We accept multiple health insurance providers including NHIF, NSSF, BRITAM, and ASSEMBLE to make healthcare accessible for everyone.",
      gradient: "from-teal-500 to-teal-600",
      icon: Shield,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600"
    },
    {
      title: "QUALITY MEDICINE",
      description:
        "Access to genuine, quality medications from trusted suppliers to ensure effective treatment and quick recovery.",
      gradient: "from-purple-500 to-purple-600",
      icon: Pill,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      title: "24/7 SERVICE",
      description:
        "Round-the-clock emergency services and medical care available whenever you need us, day or night.",
      gradient: "from-green-500 to-green-600",
      icon: Clock,
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
  ];

  const stats = [
    { number: "5000+", label: "Patients Served", icon: Heart },
    { number: "20+", label: "Medical Specialists", icon: Users },
    { number: "15+", label: "Years Experience", icon: Award },
    { number: "24/7", label: "Emergency Care", icon: Activity }
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
            <div
              onClick={scrollToTop}
              className="flex items-center space-x-2 cursor-pointer group"
            >
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg transform group-hover:scale-110 transition-transform duration-300 bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: "url('/SMC Logo.png')" }}
              />
              <span className="text-sm sm:text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                SEGESE MEDICAL CLINIC
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 lg:space-x-8 text-gray-700 font-medium">
              <button
                onClick={scrollToTop}
                className={`hover:text-blue-600 transition-colors duration-200 ${
                  activeLink === "home" ? "text-blue-600 font-semibold" : ""
                }`}
              >
                Home
              </button>

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
                className={`hover:text-blue-600 transition-colors duration-200 ${
                  activeLink === "contact" ? "text-blue-600 font-semibold" : ""
                }`}
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
              <button
                onClick={scrollToTop}
                className={`block w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                  activeLink === "home" ? "bg-blue-50 text-blue-600 font-semibold" : ""
                }`}
              >
                Home
              </button>

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
                className={`block w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                  activeLink === "contact" ? "bg-blue-50 text-blue-600 font-semibold" : ""
                }`}
              >
                Contact
              </a>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main
        id="home"
        className="relative pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 overflow-hidden"
        style={{
          backgroundImage: "url('/images/bg2.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 to-white/80"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Side */}
            <div className="space-y-4 sm:space-y-6">
              <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-xs sm:text-sm font-medium">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Quality Healthcare Since 2009
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Your Health, <br />
                <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Our Priority
                </span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed">
                Segese Medical Clinic & Fufumo Pharmacy provides comprehensive healthcare 
                services with compassion, expertise, and state-of-the-art facilities.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <NavLink
                  to="/our-services"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base"
                >
                  Our Services
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </NavLink>
                
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 font-semibold text-sm sm:text-base"
                >
                  Contact Us
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-6 sm:pt-8">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center p-3 bg-white/50 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stat.number}</div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Hidden on mobile */}
            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-300 rounded-3xl transform rotate-6"></div>
              <img
                src="/images/DoctorMapula.jpg"
                alt="Medical Professional"
                className="relative rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300 w-full h-auto"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Info Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose Us?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              We combine medical excellence with compassionate care to provide the best healthcare experience
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {infoItems.map((info, idx) => {
              const IconComponent = info.icon;
              return (
                <div
                  key={idx}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  {/* Icon Header */}
                  <div className={`bg-gradient-to-br ${info.gradient} p-5 sm:p-6 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className={`${info.iconBg} w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transform group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`w-7 h-7 sm:w-8 sm:h-8 ${info.iconColor}`} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">{info.title}</h3>
                  </div>

                  {/* Description */}
                  <div className="p-5 sm:p-6">
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{info.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Need Medical Assistance?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 px-4">
            Our team is ready to help you 24/7. Book an appointment or visit us today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <a
              href="tel:+255762948291"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-200 transition-all duration-300 shadow-lg font-semibold text-sm sm:text-base"
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Call Now
            </a>
            <a
              href="/patient-login"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-blue-700 text-white border-2 border-white rounded-lg hover:bg-blue-800 transition-all duration-300 font-semibold text-sm sm:text-base"
            >
              Book Appointment
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </a>
          </div>
        </div>
      </section>

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
                  />
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
            <p>&copy; {new Date().getFullYear()} Segese Medical Clinic & Fufumo Pharmacy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}