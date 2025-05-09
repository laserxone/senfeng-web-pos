'use client';
import React from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
export default function Providers({
  children
}) {
  return (
    <>
      <ThemeProvider attribute='class' defaultTheme='light' enableSystem>
       {children}
      </ThemeProvider>
    </>
  );
}
