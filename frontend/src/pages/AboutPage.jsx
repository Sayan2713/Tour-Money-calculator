import React from 'react';
import PageContainer from '../components/PageContainer';

const AboutPage = () => (
  <PageContainer title="About TripSplit">
    <p className="text-gray-700 text-lg">
      Welcome to TripSplit! This application was created to solve the common problem of tracking and settling group expenses during trips, dinners, or any shared activity.
    </p>
    <p className="mt-4 text-gray-700">
      Our goal is to provide a simple, clean, and powerful tool that handles all the complex calculations for you. Using the MERN stack, this app features real-time database updates and a secure, token-based authentication system.
    </p>
  </PageContainer>
);

export default AboutPage;