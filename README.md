# 🌱 Greenr

Greenr estimates your annual carbon footprint and shows how you can take action to reduce it. Take multiple calculations and see your Greenr history.

## 🚀 Features

- Annual carbon footprint estimation
- Category breakdowns to highlight major emission sources
- Actionable suggestions to reduce impact
- Calculation history tracking
- Clean, modern UI

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Framer Motion

### Backend
- Python
- FastAPI

### Deployment
- Vercel (frontend)
- Fly.io (backend)

## 📦 Project Structure

```text
greenr/
├── client/          # Frontend (React + Vite)
├── server/          # Backend (FastAPI)
└── README.md
```

## 🧮 How It Works

1. Answer a short set of questions about your lifestyle.
2. Greenr estimates annual CO₂ emissions using averages and public emissions factors.
3. Results are displayed with clear category breakdowns.
4. Save calculations to track changes over time.

Greenr prioritizes accessibility and clarity over perfect precision. Results are estimates meant to guide better decisions.

## 🖥️ Local Development

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.10+

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

### Backend Setup

```bash
cd server
python -m venv venv
source venv/bin/activate   # macOS/Linux
# .\\venv\\Scripts\\activate  # Windows

pip install -r requirements.txt
uvicorn main:app --reload
```

## 🌍 Live Demo

- Website: https://trygreenr.vercel.app
- Learn more: https://pyne.dev/

## 🎯 Roadmap

- User accounts & authentication
- Improved data visualizations
- More granular emissions categories
- Personalized reduction plans
- Mobile-first refinements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

Made with 💚 to help turn awareness into action.
