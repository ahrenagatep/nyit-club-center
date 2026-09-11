### Backend code goes here, placeholder file delete later

### 1\. Database Setup (PostgreSQL on Supabase)

*   Create the Supabase project, get your connection string/env vars sorted
    
*   Write the schema as actual SQL (or via Supabase's table editor) matching your ER diagram: users, clubs, memberships, events, attendance, club\_messages, direct\_messages, favorites, notifications
    
*   Set primary/foreign keys and constraints (e.g., composite PKs on memberships, attendance, favorites)
    
*   Add a CHECK or enum constraint on users.role for Student/Moderator/Admin
    
*   Seed a small amount of test data so you're not developing against an empty DB
    

### 2\. Backend Project Scaffolding (Node.js + Express)

*   Init the Express app, folder structure (routes / controllers / models / middleware)
    
*   Connect to PostgreSQL (via pg or an ORM like Prisma/Sequelize — worth deciding this early since it affects how fast you move)
    
*   Set up environment config (.env for DB creds, JWT secret, etc.)
    

### 3\. Authentication (this is the core Week 1–2 deliverable)

Straight from your functional requirements:

*   **Registration endpoint**: accepts NYIT email + password, rejects non-institutional domains (regex/domain check on @nyit.edu)
    
*   **Email verification flow**: generate a verification token, send/confirm it (even a stub/mock email service is fine for now if a real one isn't set up yet)
    
*   **Password hashing**: bcrypt before storing in users.password
    
*   **Login endpoint**: validate credentials, issue a JWT
    
*   **JWT middleware**: verify token on protected routes, attach user/role to the request
    
*   **Role-based access scaffold**: middleware that checks role (Student/Moderator/Admin) — you don't need every permission built yet, just the mechanism
    

### 4\. Basic RESTful API skeleton

Stub out routes (even if just returning placeholder data) for the tables that later weeks depend on:

*   /auth/register, /auth/login, /auth/verify
    
*   /users/:id (basic CRUD stub)
    
*   /clubs (stub, since Weeks 5–8 build this out fully)