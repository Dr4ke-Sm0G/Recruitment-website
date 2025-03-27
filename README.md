# 🧑‍💼 Recruitment Website

A full-stack Node.js recruitment platform where candidates can apply for job offers and recruiters can manage postings and organizations. Built with Express, MySQL, EJS, and Bootstrap.

---

## 🚀 Features

- Candidate & recruiter authentication
- Organization management
- Job offer creation & application
- Admin dashboard
- Role-based access (candidate, recruiter, admin)
- Responsive UI

---

## 📁 Project Structure

├── app.js ├── bin/ ├── config/ ├── controller/ ├── jobs/ ├── model/ ├── public/ ├── routes/ ├── utils/ ├── views/ ├── .env ├── package.json


---

## ⚙️ Requirements

- [Node.js](https://nodejs.org/) (v14+ recommended)
- [MySQL](https://www.mysql.com/) or [WAMP/MAMP/XAMPP](https://www.wampserver.com/)
- Git

---

## 🛠 Installation & Setup

1. **Clone the repository**

```bash
git clone https://github.com/your-username/recruitment-website.git
cd recruitment-website
```
2. **Install dependencies**
```bash
npm install
```
3. **Create .env file**
At the root of the project, create a .env file and fill it like this:
```bash
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=recruitment_db
PORT=3000
```
4. **Create the MySQL database**

Open phpMyAdmin or MySQL Workbench

Run the init.sql file to create all tables

Make sure the database name matches the one in .env

5. **Start the app**
```bash
npm start

```
Then open http://localhost:3000 in your browser.
