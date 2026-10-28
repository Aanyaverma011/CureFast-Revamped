# CureFast — Hospital Management System

CureFast is a full-stack Hospital Management System built using the MERN stack, Clerk authentication, and Tailwind CSS. It streamlines doctor management, appointment booking, and healthcare service management through dedicated patient and admin portals. The platform also features hospital analytics and an AI-powered health information chatbot that provides symptom-related educational guidance, self-care information, and medical warning signs.

## Features

### Patient Portal
- Secure authentication and account access
- Doctor discovery and browsing
- Appointment booking and slot-based scheduling
- Healthcare service discovery
- Appointment management
- Responsive interface for desktop and mobile devices

### Admin Portal
- Doctor management
- Appointment management
- Healthcare service management
- Dashboard analytics and operational insights

### AI Health Information Assistant
- Answers general health-related questions in natural language
- Explains possible causes of symptoms without claiming a definitive diagnosis
- Provides general self-care guidance and relevant medical warning signs
- Offers appropriate next steps and emergency guidance when necessary
- Renders structured responses with readable headings, lists, and paragraphs

*The chatbot provides general health information and is not a substitute for professional medical evaluation.*

### Additional Capabilities
- RESTful API integration between frontend and backend
- MongoDB data persistence using Mongoose
- Cloudinary integration for image uploads
- Appointment booking without online payment

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js
- Express.js
- RESTful APIs

### Database
- MongoDB
- Mongoose

### Authentication and Integrations
- Clerk — authentication and user management
- JWT — include only where token validation is implemented
- Cloudinary — image storage and management

### AI Integration
- LLM-based health information chatbot
- AI provider and SDK: document the actual provider and library used in the implementation

## Project Structure

```text
CureFast/
├── frontend/    # Patient-facing application
├── admin/       # Admin dashboard
└── backend/     # Server and API logic
```

## Getting Started

### Prerequisites
- Node.js and npm
- MongoDB connection or MongoDB Atlas
- Required API credentials for the integrations you use

### 1. Clone the Repository

```bash
git clone https://github.com/Aanyaverma011/CureFast.git
cd CureFast
```

### 2. Configure Environment Variables

Create the required `.env` files in the appropriate application directories.

Configure the variables required by your actual codebase, such as:
- MongoDB connection URI
- Clerk publishable and secret keys
- JWT secret, if used by your backend
- Cloudinary credentials
- AI provider API key, if required by the chatbot

Use the variable names expected by your code. Never commit actual API keys, passwords, or database credentials.

### 3. Install and Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Install and Run the Admin Panel

Open a separate terminal:

```bash
cd admin
npm install
npm run dev
```

### 5. Install and Run the Backend

Open another terminal:

```bash
cd backend
npm install
npm start
```

Check each directory's `package.json` to confirm the available scripts and required configuration before running the application.

## Screenshots

<img width="1470" height="956" alt="Screenshot 2026-10-28 at 3 19 31 PM" src="https://github.com/user-attachments/assets/55a51fa5-f517-4d96-adf2-de7502e8fffb" />

<img width="1470" height="956" alt="Screenshot 2026-10-28 at 3 19 12 PM" src="https://github.com/user-attachments/assets/beb47017-8d1b-4473-98a6-96ce907f1ba3" />

<img width="1470" height="956" alt="Screenshot 2026-10-28 at 3 19 07 PM" src="https://github.com/user-attachments/assets/bc793388-7abc-4858-8d11-0b0b93a5e57a" />


## Project Presentation

[CureFast_Presentation.pptx](https://github.com/user-attachments/files/34073412/CureFast_Presentation.pptx)


## Future Enhancements

- AI-assisted doctor recommendations
- Email and SMS appointment notifications
- Medical history management
- Video consultation integration
- Online payment integration

These are planned enhancements and should be updated as implementation progresses.

## Author

**Aanya Verma**

- GitHub: https://github.com/Aanyaverma011
- LinkedIn: https://www.linkedin.com/in/aanya-verma-74a1872a3
- LeetCode: https://leetcode.com/u/aanyathecoder1/





