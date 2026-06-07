# 🚀 GitHub Summarizer

GitHub Summarizer is a **full-stack web application** that allows users to search for any GitHub username and instantly view profile details, recent repositories, and an **AI-generated summary** of the developer’s public GitHub activity.

The application also **stores summarized results in MongoDB**, enabling caching and faster repeated access.

🔗 **Live Demo**  
👉 https://github-summarizer-five.vercel.app/

---

## 📌 Why This Project?

GitHub profiles often act as a developer’s resume.  
This project explores how **AI can be used to summarize a developer’s GitHub presence**, while also demonstrating real-world **full-stack development, API integration, database persistence, and cloud deployment**.

This project was built to gain hands-on experience with:
- Frontend–backend communication
- AI API integration
- Database persistence
- Production deployment and debugging

---

## ✨ Features

- 🔍 Search any GitHub user by username  
- 👤 Display profile details (bio, followers, public repos)  
- 📦 Show recent repositories  
- 🤖 Generate AI-powered developer summaries  
- 💾 Store summaries in MongoDB for caching  
- 🌐 Fully deployed frontend & backend  

---

## 🛠 Tech Stack

### Frontend
- React (Vite)
- CSS
- Deployed on **Vercel**

### Backend
- Node.js
- Express.js
- Deployed on **Render**

### Database
- MongoDB Atlas

### AI Integration
- Hugging Face Inference API

---

## 🧠 Application Architecture

Frontend (Vercel)
↓
Backend API (Render)
↓
GitHub API + Hugging Face API
↓
MongoDB Atlas (cached summaries)


---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
MONGO_URI=your_mongodb_connection_string
HF_TOKEN=your_huggingface_api_token

📈 What I Learned

Designing and building a full-stack application

Integrating third-party APIs (GitHub & Hugging Face)

MongoDB schema design and persistence

Handling environment variables across local and cloud setups

Debugging deployment issues on Render and Vercel

🚧 Future Improvements

Search history UI

Authentication

Better caching strategy

Rate-limit handling

UI/UX enhancements

👨‍💻 Author

Krishanu Chetia
Aspiring Full-Stack Developer

GitHub: https://github.com/Krishanu13-02

LinkedIn: https://www.linkedin.com/in/krishanu-chetia-5106511b4
