### Quick start with the live server https://rtcms-nitjsr.vercel.app/

## test students 
- acc: put any email in format 202xxxxxxxx@nitjsr.ac.in (ie. 2024ugcs002@nitjsr.ac.in)  psw:(any 8 digit entity)
  
## test admins 
- acc: enquiry@nitjsr.ac.in  psw:pass1234
- acc: estate@nitjsr.ac.in  psw:pass1234
- acc: it@nitjsr.ac.in  psw:pass1234
- acc: deanacad@nitjsr.ac.in  psw:pass1234
- acc: mess@nitjsr.ac.in  psw:pass1234
- acc: chiefwarden@nitjsr.ac.in psw:pass1234

## test superadmins
- acc: director@nitjsr.ac.in  psw:pass1234
- acc: dean.sw@nitjsr.ac.in psw:pass1234


# Smart Complaint Management System (RTCMS)

RTCMS is a production-ready, real-time complaint management platform designed to solve a persistent operational problem in large educational institutions: the lack of a transparent, accountable, and trackable system for handling campus grievances.

Built with NIT Jamshedpur as a real-world use case, RTCMS replaces fragmented email chains and manual follow-ups with a structured, role-driven workflow that connects students directly with responsible administrative authorities.

## Problem Statement

In most institutions, complaints related to hostels, mess services, academics, IT, or infrastructure are:
- Scattered across emails and informal channels
- Difficult to track or audit
- Slow to resolve due to unclear ownership
- Opaque to students once submitted

RTCMS addresses this gap by introducing a centralized system with real-time updates, clear accountability, and full lifecycle visibility for every complaint.

## Solution Overview

RTCMS provides:
- A single entry point for all campus-related complaints
- Automatic routing to the appropriate administrative department
- Real-time status updates and activity tracking
- Role-based access for students, admins, and super admins
- An auditable timeline of every action taken

The system is designed to scale across departments while maintaining clarity, responsiveness, and institutional control.

## Key Features

- **Role-Based Access Control**
  - Students, Admins, and Super Admins each have dedicated dashboards and permissions
- **End-to-End Complaint Lifecycle**
  - Open → Claimed → In Progress → Resolved
- **Real-Time Updates**
  - Instant status changes and notifications using WebSockets
- **Activity Timeline**
  - Every action is logged for transparency and accountability
- **Evidence Upload**
  - Image attachments for better issue validation
- **Department-Based Routing**
  - Complaints are automatically assigned to the relevant authority
- **Integrated FAQs**
  - Reduces redundant complaints through self-service information
- **Responsive Interface**
  - Works seamlessly across desktop and mobile devices

## Live Administrative Structure (Current Deployment)

RTCMS is designed around real institutional roles rather than hypothetical users.

### Current Admin Accounts

Each admin account represents a department responsible for resolving complaints in its domain:

- enquiry@nitjsr.ac.in  
- estate@nitjsr.ac.in  
- it@nitjsr.ac.in  
- deanacad@nitjsr.ac.in  
- mess@nitjsr.ac.in  
- chiefwarden@nitjsr.ac.in  

Admins can:
- View department-specific complaints
- Claim ownership of issues
- Update status and resolution progress
- Communicate actions transparently to students

### Current Super Admin Accounts

Super admins oversee the system at an institutional level:

- director@nitjsr.ac.in  
- dean.sw@nitjsr.ac.in  

Super admins can:
- Monitor all complaints across departments
- Manage admin access and permissions
- Audit complaint resolution timelines
- Gain system-wide visibility and accountability

## Tech Stack

### Frontend

- Next.js (App Router)
- React
- Tailwind CSS
- shadcn/ui (Radix UI)
- Axios for API communication
- Socket.io Client for real-time updates

### Backend

- Node.js with Express
- TypeScript
- PostgreSQL
- Socket.io for real-time communication
- Cloudinary for file storage
- node-cron for scheduled background tasks

## System Architecture

rtcms-nitjsr/
├── app/ # Next.js application (pages, layouts)
├── components/ # Reusable UI components
├── backend/
│ ├── src/
│ │ ├── config/ # Environment and database configuration
│ │ ├── controllers/ # API request handling
│ │ ├── routes/ # REST API endpoints
│ │ └── services/ # Business logic and real-time services
│ └── migrations/ # Database schema migrations
└── public/ # Static assets


## Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL
- Cloudinary account

### Backend Setup

cd backend
npm install

### Create a .env file:

PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/complaint_db
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000


### Run migrations and start the server:

npm run migrate
npm run dev

### Frontend Setup
cd ..
npm install


### Create a .env file:

NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000


### Start the client:

npm run dev

The application will be available at http://localhost:3000.

### Usage Flow

# Students
Register using institutional email
Submit complaints with optional evidence
Track real-time status and activity history

# Admins
Access department-specific dashboards
Claim and resolve assigned complaints
Maintain transparent resolution logs

# super Admins
Oversee institutional performance
Ensure accountability across departments
Monitor resolution timelines and system health
