// src/components/layout/MainNavigation.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Modal from '../common/Modal';   // Đảm bảo Modal component đã được tạo và import đúng
import Button from '../common/Button'; // Đảm bảo Button component đã được tạo và import đúng

export default function MainNavigation() {
  const { user, signOut, isAdmin, session } = useAuth(); // Thêm session
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const userDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const promptSignOut = () => {
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
    setShowLogoutModal(true);
  };

  const confirmSignOut = async () => {
    await signOut(); // signOut từ AuthContext đã xử lý việc clear state
    setShowLogoutModal(false);
    // Reload trang chủ để đảm bảo mọi state được làm mới hoàn toàn
    // và onAuthStateChange có cơ hội chạy lại với session null
    window.location.replace('/');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
      if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('button[aria-controls="navbar-default"]')) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownRef, mobileMenuRef, isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  }, [location.pathname]);

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  };

  const navLinkBaseClass = "block py-2 md:py-0 px-3 rounded md:hover:bg-transparent md:border-0 md:hover:text-primary-green md:p-0 dark:text-gray-300 md:dark:hover:text-primary-green";
  const mobileSpecificClass = "hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent";

  const commonLinks = (
    <>
      <li><Link to="/" className={`${navLinkBaseClass} ${mobileSpecificClass}`} onClick={closeAllMenus}>Trang Chủ</Link></li>
      <li><Link to="/cars" className={`${navLinkBaseClass} ${mobileSpecificClass}`} onClick={closeAllMenus}>Thuê Xe</Link></li>
      <li><Link to="/news" className={`${navLinkBaseClass} ${mobileSpecificClass}`} onClick={closeAllMenus}>Tin Tức</Link></li>
      <li><Link to="/contact" className={`${navLinkBaseClass} ${mobileSpecificClass}`} onClick={closeAllMenus}>Liên Hệ</Link></li>
    </>
  );

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-50 dark:bg-gray-800">
        <div className="container mx-auto flex flex-wrap justify-between items-center px-4 py-3">
          <Link to="/" className="text-2xl font-bold text-primary-green dark:text-primary-green">
            THUÊ XE ONLINE
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            type="button"
            className="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-default"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="sr-only">Open main menu</span>
            {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>

          <div
            ref={mobileMenuRef}
            className={`${isMobileMenuOpen ? 'block absolute top-full left-0 right-0 mt-0.5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 md:shadow-none md:static md:bg-transparent md:border-t-0' : 'hidden'} w-full md:block md:w-auto`}
            id="navbar-default"
          >
            <ul className={`font-medium flex flex-col p-4 md:p-0 md:flex-row md:space-x-8 rtl:space-x-reverse md:items-center ${isMobileMenuOpen ? 'divide-y divide-gray-100 dark:divide-gray-700 md:divide-y-0' : ''}`}>
              {commonLinks}
              {user && session ? ( // Kiểm tra cả user và session để chắc chắn đã load xong
                <li className="relative mt-4 md:mt-0" ref={userDropdownRef}>
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center py-2 px-3 text-gray-900 dark:text-white hover:text-primary-green md:p-0 w-full md:w-auto text-left"
                    type="button"
                  >
                    <UserCircleIcon className="w-6 h-6 mr-2 hidden md:inline" />
                    {user.profile?.full_name || user.email?.split('@')[0] || 'Tài khoản'}
                    <svg className={`w-2.5 h-2.5 ml-auto md:ml-2 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                    </svg>
                  </button>
                  {isUserDropdownOpen && (
                    <div className={`absolute mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-20 ring-1 ring-black ring-opacity-5 dark:bg-gray-700 dark:ring-gray-600 ${isMobileMenuOpen ? 'static md:absolute border dark:border-gray-600 !mt-2 !ml-0' : 'md:right-0'}`}>
                      <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white" onClick={closeAllMenus}>Dashboard</Link>
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white" onClick={closeAllMenus}>Thông tin</Link>
                      {isAdmin && <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white" onClick={closeAllMenus}>Admin Panel</Link>}
                      <div className="border-t border-gray-100 dark:border-gray-600 my-1"></div>
                      <button onClick={promptSignOut} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white">
                        Đăng Xuất
                      </button>
                    </div>
                  )}
                </li>
              ) : (
                <>
                  <li className="mt-4 md:mt-0"><Link to="/login" className={`${navLinkBaseClass} ${mobileSpecificClass} text-secondary-blue dark:text-secondary-blue`} onClick={closeAllMenus}>Đăng Nhập</Link></li>
                  <li className="mt-2 md:mt-0 md:ml-2 w-full md:w-auto">
                    <Link to="/register" className="block text-center w-full bg-primary-green text-white px-4 py-2 rounded-md hover:bg-primary-green-dark" onClick={closeAllMenus}>Đăng Ký</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Modal Xác Nhận Đăng Xuất */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Xác Nhận Đăng Xuất"
        footerContent={
          <>
            <Button variant="outline" onClick={() => setShowLogoutModal(false)} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">Hủy</Button>
            <Button onClick={confirmSignOut} variant="danger" className="!bg-red-600 hover:!bg-red-700">
              Đăng Xuất
            </Button>
          </>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?
        </p>
      </Modal>
    </>
  );
}