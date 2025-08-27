// src/components/layout/Header.jsx
import React from 'react';
import TopBar from './TopBar';
import MainNavigation from './MainNavigation';

export default function Header() {
  return (
    <header>
      <TopBar />
      <MainNavigation />
    </header>
  );
}